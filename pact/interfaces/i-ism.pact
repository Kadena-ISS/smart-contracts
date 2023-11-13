(namespace "free")

(interface ism-iface
  
  ;;TODO: add docs for all the methods

  (defschema validators
     known:bool  
  )

  (defschema ism-data
    validators:[string]
    threshold:integer  
  )

  (defschema hyperlane-metadata
    originMerkleTreeAddress:string
    signedCheckpointRoot:string
    signedCheckpointIndex:integer
    signatures:[string]
  )

  (defun validators-and-threshold:[[string], integer] ())

  (defun digest:string (metadata:string message:string))

  (defun verify:bool (metadata:string message:string))
)