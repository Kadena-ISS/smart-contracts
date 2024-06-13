(namespace "free")

(interface ism-iface
  
  (defschema ism-state
    validators:[string]
    threshold:integer  
  )

  (defun validators-and-threshold:object{ism-state} ()
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )

  (defun get-validators:[string] ()
    @doc "TODO: finish docs"
  )
)