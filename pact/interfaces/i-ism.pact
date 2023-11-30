(namespace "free")

(interface ism-iface
  
  (defschema ism-state
    validators:[string]
    threshold:integer  
  )

  ;  (defun validators-and-threshold:[[string], integer] ()
  ;    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  ;  )

)