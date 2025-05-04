;; IMultisigIsm

(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")

(interface ism-iface

  (use hyperlane-message)
  
  (defschema ism-state
    validators:[string]
    threshold:integer  
  )

  (defun validators-and-threshold:object{ism-state} (message:object{hyperlane-message})
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )

  (defun get-threshold:integer (message:object{hyperlane-message})
    @doc "Returns the threshold"
  )

  (defun get-validators:[string] (message:object{hyperlane-message})
    @doc "Returns the array of validators responsible for verifying _message"
  )
)