(namespace "free")

(interface igp-iface

  (defschema igp-state
    gas-oracle:module{gas-oracle-iface}  
  )
  
  ;;TODO: add docs for all the methods

  (defun pay-for-gas (domain:string gas-amount:decimal))

  (defun quote-gas-payment:decimal (domain:string gas-amount:decimal))

)
  