(namespace "free")

;; KNOTE: most of these interfaces seem to not be necessary,
;; probably just artifacts from Solidity. In general, without
;; a modref with that interface, the interface is unnecessary,
;; and we're looking at having the mailbox call into token contracts
;; instead of the other way around.
(interface mailbox-iface

  (defschema mailbox-state
    nonce:integer
    latest-dispatched-id:string
    ism:module{ism-iface}
    igp:module{igp-iface}
  )

  (defschema delivery
    ;  processor:string
    block-number:integer
  )

  (defschema recipient
    recipient-router:module{handler-iface}
  )

  (defun quote-dispatch:decimal (destination:string)
    @doc "Computes payment for dispatching a message to the destination domain & recipient."
  )

  (defun dispatch:string (sender:string destination:string recipient:string recipient-tm:string amount:decimal)
    @doc "Dispatches a message to the destination domain & recipient."
  )

  (defun process:bool (metadata:string message:string)
    @doc "Attempts to deliver HyperlaneMessage to its recipient."
  )

)
