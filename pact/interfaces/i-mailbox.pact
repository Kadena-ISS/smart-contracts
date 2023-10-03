(namespace "free")

(interface mailbox-iface

  ;;TODO: add docs for all the methods
  (defun process:bool (message:string))
 
  (defun dispatch:bool (domain:string recipient:string messageBody:string))
 
  (defun quote-dispatch:bool (domain:string gas-amount:integer))
)
