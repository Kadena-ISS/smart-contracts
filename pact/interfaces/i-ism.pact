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

  (defun validators-and-threshold:{verify-data} ()
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )
)