(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; `verify-spv` functions do most of the functionality of ISM.

(module ism GOVERNANCE

  (implements ism-iface)

  (use ism-iface [ism-state verify-output])

  ;;Tables
  (deftable contract-state:{ism-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

  (defun initialize (validators:[string] threshold:integer)
    ;  (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
            "validators": validators,
            "threshold": threshold
        }
      )
    ;  )
  )

  ;; notice: Hyperlane ISM Types: 
  ;  UNUSED = 0,
  ;  ROUTING = 1,
  ;  AGGREGATION = 2,
  ;  LEGACY_MULTISIG = 3,
  ;  MERKLE_ROOT_MULTISIG = 4,
  ;  MESSAGE_ID_MULTISIG = 5,
  ;  NULL = 6, // used with relayer carrying no metadata
  ;  CCIP_READ = 7

  (defun module-type:integer ()
    5
  )

  (defun validators-and-threshold:object{ism-state} ()
    (with-read contract-state "default"
      {
        "validators" := validators,
        "threshold" := threshold
      }
      {
        "validators": validators,
        "threshold": threshold
      }
    )
  )

  (defun validators:[string] ()
    (with-read contract-state "default"
      {
        "validators" := validators
      }
      validators
    )
  )

  (defun get-threshold:integer ()
    (with-read contract-state "default"
      {
        "threshold" := threshold
      }
      threshold
    )
  )
  
)

(if (read-msg "init")
  [
    (create-table free.ism.contract-state)
  ]
  "Upgrade complete")
