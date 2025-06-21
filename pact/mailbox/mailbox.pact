;; Mailbox

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module mailbox GOVERNANCE

   ;; Imports
   (use hyperlane-message)
   (use mailbox-state-iface)

   ;; Schemas
   (defschema decoded-token-message
      recipient:keyset
      amount:decimal
      chainId:integer )

   ;; Tables
   (deftable contract-state:{mailbox-state})
   (deftable dependencies:{dependency})
   (deftable deliveries:{delivery})
   (deftable hashes:{router-hash})

   ;; Capabilities
   (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

   (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))

   (defcap PAUSE () (enforce-guard "NAMESPACE.bridge-pausers"))

   (defcap INTERNAL () true)

   (defcap ONLY_MAILBOX_CALL:bool (m:module{router-iface} origin:integer sender:string chainId:integer recipient:string recipient-guard:guard amount:decimal) true)
   
   (defcap POST_DISPATCH_CALL:bool (id:string) true)

   (defcap PROCESS-MLC (message-id:string message:object{hyperlane-message} signers:[string] threshold:integer)
      (enforce-verifier "hyperlane_v3_message")
      (enforce (= 3 (at "version" message)) "Invalid hyperlane version")
      (enforce (= message-id (hyperlane-message-id message)) "Invalid calculated messageId")
      (enforce (= LOCAL_DOMAIN (at "destinationDomain" message)) "Invalid destinationDomain")
   )

   ;; Constants
   (defconst LOCAL_DOMAIN:integer 626)
   (defconst VERSION:integer 3)

   ;; Events
   (defcap SENT_TRANSFER_REMOTE (destination:integer recipient:string amount:decimal)
      @doc "Emitted on `transferRemote` when a transfer message is dispatched"
      @event true )

   (defcap DISPATCH (version:integer nonce:integer sender:string destination:integer recipient:string message-body:string)
      @doc "Emitted when a new message is dispatched via Hyperlane"
      @event true )

   (defcap DISPATCH-ID (message-id:string)
      @doc "Emitted when a new message is dispatched via Hyperlane"
      @event true )

   (defcap PROCESS (origin:integer sender:string recipient:string)
      @doc "Emitted when a Hyperlane message is delivered"
      @event true )

   (defcap PROCESS-ID (message-id:string)
      @doc "Emitted when a Hyperlane message is processed"
      @event true )

   (defun initialize:string ()
      @doc "Initializes the contract"
      (with-capability (ONLY_ADMIN)
         (insert contract-state "default"
            {
               "paused": false,
               "nonce": 0,
               "latest-dispatched-id": "0"
            } )))

   (defun pause:string (b:bool)
      @doc "Pauses the contract"
         (with-capability (PAUSE)
            (update contract-state "default"
               { "paused": b } )))

   (defun define-hook:string (hook:module{hook-iface})
      @doc "Defines hook in the contract"
      (with-capability (ONLY_ADMIN)
         (write dependencies "default"
            { "hook": hook } )))

   (defun store-router:string (router:module{router-iface})
      @doc "Stores a router in the contract"
         (with-capability (ONLY_ADMIN)
            (write hashes (get-router-hash router)
               { "router-ref": router } )))

   (defun update-dispatch (old-nonce:integer id:string)
      @doc "Updates the nonce and the latest dispatched id in the contract state"
      (require-capability (INTERNAL))
      (enforce (>= old-nonce 0) "Nonce must be positive")
      (update contract-state "default"
         {
            "latest-dispatched-id": id,
            "nonce": (+ old-nonce 1)
         } ))

   (defun update-process (id:string)
         @doc "Updates the block-number in the contract state"
         (require-capability (INTERNAL))
         (with-default-read deliveries id
            { "block-number": 0 }
            { "block-number" := block-number }
            (enforce (= block-number 0) "Message has been submitted"))
         (insert deliveries id { "block-number": (at "block-height" (chain-data)) }) )

   (defun paused:bool ()
      (with-read contract-state "default"
         { "paused" := paused }
         paused ))

   (defun get-hook:module{hook-iface} ()
      (with-read dependencies "default"
         { "hook" := hook:module{hook-iface} }
         hook ))

   (defun delivered:bool (id:string)
      (with-default-read deliveries id
         { "block-number": 0 }
         { "block-number" := block-number }
         (> block-number 0) ))

   (defun nonce:integer ()
      (with-read contract-state "default"
         { "nonce" := nonce }
         nonce ))

   (defun recipient-ism ()
      domain-routing-ism )

   (defun get-router:module{router-iface} (router-hash:string)
      (with-read hashes router-hash
         { "router-ref" := router:module{router-iface} } 
         router ))

   (defun prepare-dispatch-parameters (router:module{router-iface} destination-domain:integer recipient:string message-body:string)
      {
         "version": VERSION,
         "nonce": (nonce),
         "originDomain": LOCAL_DOMAIN,
         "sender": (get-router-hash router),
         "destinationDomain": destination-domain,
         "recipient": recipient,
         "messageBody": message-body
      } )

   (defun get-router-hash:string (router:module{router-iface})
      (base64-encode (take 32 (hash router))) )

   (defun quote-dispatch:decimal (destination:integer)
      @doc "Computes payment for dispatching a message to the destination domain & recipient."
      (igp.quote-gas-payment destination) )

   (defun dispatch:string (router:module{router-iface} destination:integer recipient-tm:string amount:decimal)
      @doc "Dispatches a message to the destination domain & recipient."
      (let (
            (recipient:string (router::transfer-remote destination (at "sender" (chain-data)) recipient-tm amount))
            (message-body:string (hyperlane-encode-token-message {"amount": (router::get-adjusted-amount amount), "recipient": recipient-tm, "chainId": "0"}))
            (message:object{hyperlane-message} (prepare-dispatch-parameters router destination recipient message-body))
            (id:string (hyperlane-message-id message)) ) 
         (with-capability (INTERNAL)
            (update-dispatch (nonce) id) )
         (igp.pay-for-gas id destination (quote-dispatch destination))
         (with-capability (POST_DISPATCH_CALL id)
            (let ((hook:module{hook-iface} (get-hook)))
               (hook::post-dispatch id message) )) 
         (emit-event (DISPATCH 3 (- (nonce) 1) (get-router-hash router) destination recipient message-body))
         (emit-event (DISPATCH-ID id))
         id ))


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
            "chainId": chainId
         } ))

   (defun process (message-id:string message:object{hyperlane-message})
      @doc "Attempts to deliver HyperlaneMessage to its recipient."
      (with-read contract-state "default"
         { "paused" := paused }
         (enforce (not paused) "Bridge is paused.") )
      (with-capability (PROCESS-MLC message-id message (domain-routing-ism.get-validators message) (domain-routing-ism.get-threshold message))
         (bind (hyperlane-decode-token-message (at "messageBody" message))
            {
               "chainId" := chainId,
               "recipient" := recipient-guard,
               "amount" := amount
            }
            (enforce (> amount 0.0) "Amount must be positive")
            (let (
                  (origin:integer (at "originDomain" message))
                  (sender:string (at "sender" message))
                  (chain:integer (str-to-int chainId))
                  (recipient:string (create-principal recipient-guard)) )
               (enforce (and (<= chain 19) (>= chain 0)) "Invalid chain ID")
               (enforce (!= recipient "") "Recipient cannot be empty")
               (let ((router:module{router-iface} (get-router (at "recipient" message))))
                  (with-capability (ONLY_MAILBOX_CALL router origin sender chain recipient recipient-guard amount)
                     (router::handle origin sender chain recipient recipient-guard amount) ))
               (emit-event (PROCESS origin sender recipient)) ))
               (let ((id:string (hyperlane-message-id message)))
                  (with-capability (INTERNAL)
                     (update-process id) )
                  (emit-event (PROCESS-ID id)) ))))

(if (read-msg "init")
  [
      (create-table NAMESPACE.mailbox.contract-state)
      (create-table NAMESPACE.mailbox.dependencies)
      (create-table NAMESPACE.mailbox.deliveries)
      (create-table NAMESPACE.mailbox.hashes)
  ]
  "Upgrade complete")