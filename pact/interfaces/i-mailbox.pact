(namespace "free")

(interface mailbox-iface

  (defschema mailbox-state
    nonce:integer
    latest-dispatched-id:string
    ism:module{ism-iface}
    igp:module{igp-iface}
  )

  (defschema delivery
    processor:string
    block-number:integer
  )

  (defun quote-dispatch:decimal (destination:string)
    @doc "Computes payment for dispatching a message to the destination domain & recipient."
  )
 
  (defun dispatch:string (destination:string recipient:string message-body:string)
    @doc "Dispatches a message to the destination domain & recipient."
  )

  (defun process:bool (message:string)
    @doc "Attempts to deliver HyperlaneMessage to its recipient."
  )
 
)
