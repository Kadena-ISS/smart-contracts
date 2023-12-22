(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module mailbox GOVERNANCE
   (implements mailbox-iface)

   ;; Imports
   (use hyperlane-message [hyperlane-message])

   (use mailbox-iface [mailbox-state delivery recipient])

   ;; Tables
   (deftable contract-state:{mailbox-state})

   (deftable deliveries:{delivery})

   (deftable recipients:{recipient})
   
   ;; Capabilities
   (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
   
   (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))
   
   (defconst LOCAL_DOMAIN 626)

   (defconst VERSION 3)

   ;; Events
   (defcap DISPATCH
      (
         sender:string
         destination:string
         recipient:string
         recipient-tm:string
         amount:decimal
      )
      @doc "Emitted when a new message is dispatched via Hyperlane"
      @event true
   )

   (defcap DISPATCH-ID
      (
         message-id:string
      )
      @doc "Emitted when a new message is dispatched via Hyperlane"
      @event true
   )

   (defcap PROCESS
      (
      origin:string
      sender:string
      recipient:string
      )
      @doc "Emitted when a Hyperlane message is delivered"
      @event true
   )

   (defcap PROCESS-ID
      (
         message-id:string
      )
      @doc "Emitted when a Hyperlane message is processed"
      @event true
   )

   (defun initialize (ism:module{ism-iface} igp:module{igp-iface})
      (with-capability (ONLY_ADMIN)
         (insert contract-state "default"
            {
               "nonce": 0,
               "latest-dispatched-id": "0",
               "ism": ism,
               "igp": igp
            }
         )
      )
   )

   (defun store-recipient (hash:string recipient-router:module{handler-iface})
      (insert recipients hash
         {
            "recipient-router": recipient-router
         }
      )
   )

   (defun quote-dispatch:decimal (destination:string)
      (with-read contract-state "default"
         {
            "igp" := igp:module{igp-iface}
         }
         (igp::quote-gas-payment destination)
      )
   )

   ;;TODO: verify that caller has a capability
   (defun dispatch:string (sender:string destination:string recipient:string recipient-tm:string amount:decimal)
      (bind (verify-spv "HYPERLANE_V3" (prepare-dispatch-parameters sender destination recipient recipient-tm amount))
         {
            "encodedMessage" := encoded-message,
            "messageId" := id 
         }
         (with-read contract-state "default"
            {
               "nonce" := old-nonce,
               "igp" := igp:module{igp-iface}
            }
            (update contract-state "default"
               {
                  "latest-dispatched-id": id,
                  "nonce": (+ old-nonce 1)
               }
            )
            (igp::pay-for-gas id destination (quote-dispatch destination))
            (emit-event (DISPATCH sender destination recipient recipient-tm amount))
            (emit-event (DISPATCH-ID id))
         )
         id
      )
   )

   (defun prepare-dispatch-parameters (sender:string destination-domain:string recipient:string recipient-tm:string amount:decimal)
      (with-read contract-state "default"
         {
            "nonce" := nonce
         }
         {
            "message": 
            {
               "version": VERSION,
               "nonce": nonce,
               "originDomain": LOCAL_DOMAIN,
               "sender": sender, 
               "destinationDomain": (str-to-int destination-domain),
               "recipient": recipient,
               "tokenMessage": 
               {
               "recipient": recipient-tm,
               "amount": amount
               } 
            }
         }
      )    
   )
 
   (defun process:bool (metadata:string message:string)
      (with-read contract-state "default"
         {
            "ism" := ism:module{ism-iface}
         }
         (bind (ism::validators-and-threshold)
            {
               "validators" := validators,
               "threshold" := threshold      
            }
            (bind (verify-spv "HYPERLANE_V3" (prepare-process-parameters metadata message validators threshold))
               {
                  "message" := message:{hyperlane-message},
                  "messageId" := id
               }
               (with-default-read deliveries id
                  {
                     "block-number": 0
                  }
                  {
                     "block-number" := block-number
                  }
                  (enforce (= block-number 0) "Message has been submitted")   
               )
               (bind (chain-data)
                  {
                     "block-number" := block-number
                  }
                  (insert deliveries id
                     {
                        "block-number": block-number
                     }   
                  ) 
               )
               (bind message
                  {
                     "origin" := origin,
                     "sender" := sender,
                     "recipient" := recipient,
                     "token-message" := token-message:object{token-message}
                  }
                  (with-read recipients recipient
                     {
                        "recipient-router" := recipient-router:module{handler-iface} 
                     }
                     (recipient-router::handle origin sender token-message)
                  )
                  (emit-event (PROCESS origin sender recipient))
                  (emit-event (PROCESS-ID id)) 
               )
            )
         )
      )
   )   

   (defun prepare-process-parameters (metadata:string message:string validators:[string] threshold:integer)
      {
         "message": message,
         "metadata": metadata,
         "validators": validators,
         "threshold": threshold
      }
    )
)

(if (read-msg "init")
  [
    (create-table free.mailbox.contract-state)
    (create-table free.mailbox.deliveries)
    (create-table free.mailbox.recipients)
  ]
  "Upgrade complete")