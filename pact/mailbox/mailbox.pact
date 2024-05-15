(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module mailbox GOVERNANCE

   (implements mailbox-iface)

   ;; Imports
   (use hyperlane-message [hyperlane-message hyperlane-message-encoded])

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

   (defcap ONLY_MAILBOX:bool () true)

   (defcap PROCESS-MLC (message-id:string message:object{hyperlane-message-encoded} signers:[string] threshold:integer)
      (enforce-verifier "hyperlane_v3_message")
      (enforce (= message-id (hyperlane-message-id message)) "invalid calculated messageId")
      (enforce (= LOCAL_DOMAIN (at "destinationDomain" message)) "invalid destinationDomain")
      ;  (enforce false (format "{}" [message]))
   )

   ;; Constants
   (defconst LOCAL_DOMAIN 626)

   (defconst VALID_CHAIN_IDS (enumerate 0 19))

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
         message-body:string
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
      (base64-encode (take 32 (hash router)))
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
      (let*
         (
            (sender:string  (get-router-hash router))
            (recipient:string (router::transfer-remote destination (at "sender" (chain-data)) recipient-tm amount))

            (remote-amount:decimal (router::get-adjusted-amount amount))
            (message-body:string (hyperlane-encode-token-message {"amount": remote-amount, "recipient": (base64-encode recipient-tm), "chainId": "0"}))
            (message:object{hyperlane-message-encoded} (prepare-dispatch-parameters sender destination recipient message-body))
            (id:string (hyperlane-message-id message))
         )
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
            (emit-event (DISPATCH 3 old-nonce sender destination recipient message-body)) ;;notice: different args
            (emit-event (DISPATCH-ID id))
         )
         id
      )
   )

   (defun prepare-dispatch-parameters (sender:string destination-domain:string recipient:string message-body:string)
      (with-read contract-state "default"
         {
            "nonce" := nonce
         }
         {
            "version": VERSION,
            "nonce": nonce,
            "originDomain": LOCAL_DOMAIN,
            "sender": sender, 
            "destinationDomain": (str-to-int destination-domain),
            "recipient": recipient,
            "messageBody": message-body
         }
      )    
   )

   ;;TODO: 
   (defschema decoded-token-message
      recipient:keyset
      amount:decimal
      chainId:integer
   )

   (defun decode-token-message:object{decoded-token-message} (message:string)
      (bind (hyperlane-decode-token-message message)
         {
            "recipient" := recipient,
            "amount" := amount,
            "chainId" := chainId
         }
         {
            "recipient": recipient,
            "amount": (* amount 1.0),
            "chainId": (str-to-int chainId)
         }
      )
   )


   (defun process (message-id:string message:object{hyperlane-message-encoded})
      @doc "Attempts to deliver HyperlaneMessage to its recipient."
      (with-read contract-state "default"
         {
            "ism" := ism:module{ism-iface}
         }
         (with-capability (PROCESS-MLC message-id message (ism.validators) (ism.get-threshold))
            (let
               (
                  (origin:string (int-to-str 10 (at "originDomain" message)))
                  (sender:string (at "sender" message))
                  ;  (sender:string (base64-decode (at "sender" message)))
                  (recipient-router:string (at "recipient" message)) 
                  (id:string (hyperlane-message-id message))

               )
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
               (bind (hyperlane-decode-token-message (at "messageBody" message))
                  {
                     "chainId" := chainId,
                     "recipient" := recipient-guard,
                     "amount" := amount
                  }
                  (let
                     (
                        (chain:integer (str-to-int chainId))
                        (recipient:string (create-principal recipient-guard))
                     )
                     (enforce (contains chain VALID_CHAIN_IDS) "invalid chain id")
                     (with-read hashes recipient-router
                        {
                           "router-ref" := router:module{router-iface} 
                        }
                        (with-capability (ONLY_MAILBOX)
                           (router::handle origin sender (str-to-int chainId) recipient recipient-guard amount)
                        )
                     )
                     (emit-event (PROCESS origin sender recipient))
                     (emit-event (PROCESS-ID id)) 
                  )
               )
            )
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