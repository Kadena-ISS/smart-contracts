(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))



(module ism GOVERNANCE
;    (implements ism-iface)

  (use ism-iface [validators ism-data hyperlane-metadata])

  (use hyperlane-message [hyperlane-message])

  ;;Tables
  (deftable known-validators:{validators})

  ;;TODO: allow changing
  (defconst THRESHOLD 5)

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  (defun validators-and-threshold:object{ism-data} ()
    (let
        (
            (validator-keys:[string] (keys known-validators))
        )
        {
            "validators": validator-keys,
            "threshold": THRESHOLD
        }
    )
  )

  ;; TODO: use keccak256 instead
  (defun create-digest:string (metadata:string message:string)
    (let
      (
        (metadata-obj:object{hyperlane-metadata} (verify-spv "HYPER_MTD" metadata))
        (message-obj:object{hyperlane-message} (verify-spv "HYPMSG" message))
        (id:string (hash message))
      )
      (bind metadata-obj
        {
          "originMerkleTreeAddress" := originMerkleTree,
          "signedCheckpointRoot" := root,
          "signedCheckpointIndex" := index
        }
        (bind message-obj
          {
            "origin" := origin,
            "destination" := destination
          }
          (verify-spv "ETH-SIGN-MSG" 
            {
              "origin": origin, 
              "originMerkleTree": originMerkleTree, 
              "root": root,
              "index": index, 
              "id": id
            }
          )
        )
      )
    )
  )


  (defun verify:bool (metadata:string message:string)
    (let
      (
        (digest:string (create-digest metadata message))
        (validator-keys:[string] (keys known-validators))
      )
      true
      ;;TODO: some verify-spv magic here
      ;; (enforce (<= THRESHOLD actual_sigs)
    )
  )
  
)

(if (read-msg "init")
  [
    (create-table free.ism.known-validators)
  ]
  "Upgrade complete")
