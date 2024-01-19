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

   (deftable senders:{sender})

   ;; Capabilities
   (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

   (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

   (defconst LOCAL_DOMAIN 626)

   (defconst VERSION 3)

   ;; Events
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
      (with-read deliveries id
         {
            "block-number": 0
         }
         {
            "block-number" := block-number
         }
         (block-number > 0)
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
      (format "ism")
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

   ;; KTODO: add dispatch hooks to this.
   ;; KNOTE: so the way this works in solidity is that you call into a token
   ;; contract and it calls `dispatch`, and in doing so, it authorizes the
   ;; message, because the message's sender is always set to msg.sender,
   ;; i.e. the caller, i.e. the token contract.
   ;; a way to make this work similarly for us is to have a mapping from sender
   ;; address to sender modref. that way, we can ask the sender modref to perform
   ;; the burn (or whatever other action) that's necessary to authenticate
   ;; sending messages from that sender address.
   ;; one way to implement this mapping without having it as a literal table
   ;; is to use `(hash modref)` to compute the sender address, and pass the sender
   ;; modref into this function.
   (defun dispatch:string (sender:string destination:string recipient:string recipient-tm:string amount:decimal)
      (bind (verify-spv "HYPERLANE_V3" (prepare-dispatch-parameters sender destination recipient recipient-tm amount))
         {
            "encodedMessage" := encoded-message,
            "messageId" := id
            ;; KTODO: where else are they using messageId and DISPATCH-ID events?
            ;; KTODO: where is encoded-message being used?
         }
         ;; KTODO: What is "default"? Is this being used as a mutable, global variable?
         ;; KTODO: Do they just need a nonce that's always increasing? There might
         ;; a way to get this information from tx chain data.
         ;; KTODO: Is the nonce even necessary? Actually yes but just for the merkle tree hook.
         (with-read contract-state "default"
            {
               "nonce" := old-nonce,
               "igp" := igp:module{igp-iface}
            }
            ;; KTODO: IF igp is not being mutated, then it be outside of this data structure.
            (update contract-state "default"
               {
                  "latest-dispatched-id": id,
                  "nonce": (+ old-nonce 1)
               }
               ;; KTODO: What's the use of 'latest-dispatched-id'? Not used else
               ;; in the contract. Seems used only for DISPATCH-ID event.
            )
            (read senders sender)
            (igp::pay-for-gas id destination (quote-dispatch destination))
            (emit-event (DISPATCH 3 (+ old-nonce 1) sender destination recipient recipient-tm amount))
            (emit-event (DISPATCH-ID id))
            ;; KTODO: When you have a managed capability, you always emit
            ;; an event and are emitted with with-capability.
            ;; KTODO: Replace `emit-event` with `with-capability`.
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
               (with-read recipients recipient
                  {
                     "recipient-router" := recipient-router:module{handler-iface}
                  }
                  (recipient-router::handle (int-to-str 10 origin) sender token-message)
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
    (create-table free.mailbox.recipients)
  ]
  "Upgrade complete")
