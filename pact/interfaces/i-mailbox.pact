(namespace "free")

(interface mailbox-iface

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

  (defun quote-dispatch:decimal (destination:string)
    @doc "Computes payment for dispatching a message to the destination domain & recipient."
  )
 
  (defun dispatch:string (router:module{router-iface} destination:string recipient-tm:string amount:decimal)
    @doc "Dispatches a message to the destination domain & recipient."
  )

  (defun process:bool (metadata:string message:string)
    @doc "Attempts to deliver HyperlaneMessage to its recipient."
  )
 
)
