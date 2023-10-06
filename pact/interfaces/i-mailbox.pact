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

  ;;TODO: add docs for all the methods
  (defun process:bool (message:string))
 
  (defun dispatch:bool (domain:string recipient:string message-body:string gas-amount:decimal))
 
  (defun quote-dispatch:decimal (domain:string gas-amount:decimal))
)
