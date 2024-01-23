(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module mailbox GOVERNANCE

   ;; Imports
   (use hyperlane-message [hyperlane-message])

   ;; Schemas
   (defschema mailbox-state
      nonce:integer
      latest-dispatched-id:string
      ism:module{ism-iface}
      igp:module{igp-iface}
   )
  
   (defschema delivery
      block-number:integer
   )
  
   (defschema router-hash
      router-ref:module{router-iface}  
   )

   ;; Tables
   (deftable contract-state:{mailbox-state})

   (deftable deliveries:{delivery})

   (deftable hashes:{router-hash})
   
   ;; Capabilities
   (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
   
   (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))
   
   (defconst LOCAL_DOMAIN 626)

   (defconst VERSION 3)

   ;; Events

   (defcap SENT_TRANSFER_REMOTE
      (
         destination:string
         recipient:string
         amount:decimal
      )
      @doc "Emitted on `transferRemote` when a transfer message is dispatched"
      @event true
   )

   (defcap DISPATCH
      (
         version:integer
         nonce:integer
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
      ;  (with-capability (ONLY_ADMIN)
         (insert contract-state "default"
            {
               "nonce": 0,
               "latest-dispatched-id": "0",
               "ism": ism,
               "igp": igp
            }
         )
      ;  )
   )

   (defun delivered:bool (id:string)
      (with-default-read deliveries id
         {
            "block-number": 0
         }
         {
            "block-number" := block-number
         }
         (> block-number 0)
      )
   )

   (defun nonce:integer ()
      (with-read contract-state "default"
         {
            "nonce" := nonce
         }
         nonce
      )
   )

   (defun recipient-ism:string ()
      (format "ism" [])
   )

   (defun store-router (router:module{router-iface})
      (insert hashes (get-router-hash router) 
         {
            "router-ref": router
         }
      )
   )

   (defun get-router-hash (router:module{router-iface})
      (drop -11 (hash router))
   )

   (defun quote-dispatch:decimal (destination:string)
      @doc "Computes payment for dispatching a message to the destination domain & recipient."
      (with-read contract-state "default"
         {
            "igp" := igp:module{igp-iface}
         }
         (igp::quote-gas-payment destination)
      )
   )

   (defun dispatch:string (router:module{router-iface} destination:string recipient-tm:string amount:decimal)
      @doc "Dispatches a message to the destination domain & recipient."
      (let
         (
            (recipient:string (router::transfer-remote destination (at "sender" (chain-data)) recipient-tm amount))
            (sender:string  (get-router-hash router))
         )
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
               (emit-event (DISPATCH 3 old-nonce sender destination recipient recipient-tm amount)) ;;notice: different args
               (emit-event (DISPATCH-ID id))
            )
            id
         )
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
      @doc "Attempts to deliver HyperlaneMessage to its recipient."
      (with-read contract-state "default"
         {
            "ism" := ism:module{ism-iface}
         }
         (bind (ism::verify metadata message)
            {
               "message" := message,
               "id" := id
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
            (insert deliveries id
               {
                  "block-number": (at "block-height" (chain-data))
               }   
            )
            (bind message
               {
                  "originDomain" := origin,
                  "sender" := sender,
                  "recipient" := recipient,
                  "tokenMessage" := token-message:object{token-message}
               }
               (with-read hashes recipient
                  {
                     "router-ref" := router:module{router-iface} 
                  }
                  (router::handle (int-to-str 10 origin) sender token-message)
               )
               (emit-event (PROCESS (int-to-str 10 origin) sender recipient))
               (emit-event (PROCESS-ID id)) 
            )
            true
         )
      )
   )   
)

(if (read-msg "init")
  [
    (create-table free.mailbox.contract-state)
    (create-table free.mailbox.deliveries)
    (create-table free.mailbox.hashes)
  ]
  "Upgrade complete")