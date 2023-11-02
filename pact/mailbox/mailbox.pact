(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module mailbox GOVERNANCE
 (implements mailbox-iface)

 ;; Imports
 (use hyperlane-message [hyperlane-message])

 (use mailbox-iface [mailbox-state delivery])

 ;; Tables
 (deftable contract-state:{mailbox-state})

 (deftable deliveries:{delivery})
 
 ;; Capabilities
 (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
 
 (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))
 
 (defconst LOCAL_DOMAIN 626)

 (defconst VERSION 3)

 ;; Events
 (defcap DISPATCH
   (
     sender:string
     destination:integer
     recipient:string
     message:string
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
     origin:integer
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
 
 (defun process:bool (message:string)
   (let
      (
         (message-obj:{hyperlane-message} (verify-spv "HYP-MSG" message))
         (id:string (hash message)) ;;TODO: replace with keccak256
      )
      (with-default-read deliveries id
         {
            "block-number": 0
         }
         {
            "block-number" := block-number
         }
         (enforce (= block-number 0) (format "Message has been submitted" []))   
      )
      (let
         (
            (block-number:integer (at "block-height" (chain-data)))
         )
         (insert deliveries id
            {
               "block-number": block-number
            }   
         )   
      )
      ;  (emit-event PROCESS) ;;TODO: fetch values from hyperlane-message
      ;  (emit-event PROCESS-ID)
      (with-read contract-state "default"
         {
            "ism" := ism:module{ism-iface}
         }
         (ism::verify message)
      )
   )
 )

 ;;TODO: verify that caller has a capability
 (defun dispatch:string (domain:string recipient:string message-body:string gas-amount:decimal)
   (let
      (
         (message:string (verify-spv "BUILD-MSG" domain recipient message-body))
      )
      (let*
         (
            (id:string (hash message)) ;; TODO: change to keccak256
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
            ;  (emit-event ) ;;TODO: emit event Dispatch & DispatchID
            (igp::pay-for-gas id domain (quote-dispatch domain gas-amount)) ;;TODO: check gas-amount size in igp
         )
         id
      )
   )
 ) 

 (defun quote-dispatch:decimal (domain:string gas-amount:decimal)
    (with-read contract-state "default"
      {
         "igp" := igp:module{igp-iface}
      }
      (igp::quote-gas-payment domain gas-amount)
    )
 )
    
)