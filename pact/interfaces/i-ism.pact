(namespace "free")

(interface ism-iface
  
  (use hyperlane-message [hyperlane-message])

  (defschema ism-state
    validators:[string]
    threshold:integer  
  )

  (defschema verify-output
    message:object{hyperlane-message}
    id:string
  )
  
  ;  (defun verify:object{verify-output} (metadata:string message:string)
  ;    @doc "Provides the Multisig implementation of verifying signatures over a checkpoint related to a specific message ID"
  ;  )

  (defun validators-and-threshold:object{ism-state} ()
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )

  (defun validators:[string] ()
    @doc "TODO"
  )


)