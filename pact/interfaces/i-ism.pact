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

  (defschema verify-spv-output
    message:object{hyperlane-message}
    id:string
  )
  
  (defun verify:object{verify-spv-output} (metadata:string message:string)
    @doc "TODO"
  )

  (defun validators-and-threshold:{verify-data} ()
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )
)