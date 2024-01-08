(namespace "free")

(interface ism-iface
  
  (defschema ism-state
    validator-announce:module{validator-iface}
    threshold:integer  
  )

  (defschema verify-data
    validators:[string]
    threshold:integer  
  )

  (defschema temp-token-message
    recipient:string
    amount:decimal
  )

  (defschema temp-message
    version:integer
    nonce:integer
    originDomain:string
    sender:string
    destinationDomain:string
    recipient:string
    tokenMessage:object{temp-token-message}
  )

  (defschema verify-output
    ;; TODO: This throws Invalid reference in user type error
    ;  message:object{hyperlane-message}
    message:object{temp-message} 
    id:string
  )
  
  (defun verify:object{verify-output} (metadata:string message:string)
    @doc "TODO"
  )

  (defun validators-and-threshold:object{verify-data} ()
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )
)