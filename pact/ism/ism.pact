(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; `verify-spv` functions do most of the functionality of ISM.

;; TODO: Change the name to message-id-ism, replace all old `ism` names with new one

(module ism GOVERNANCE

  (implements ism-iface)

  (use ism-iface [ism-state])

  ;;Tables
  (deftable contract-state:{ism-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.upgrade-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

  (defun initialize (validators:[string] threshold:integer)
    (with-capability (ONLY_ADMIN)
      (if (and 
            (= 
              (length validators) 
              (length (distinct validators))
            )
            (> threshold 0) 
          )
          (insert contract-state "default"
            {
                "validators": validators,
                "threshold": threshold
            }
          )
          "Invalid validators or threshold"
      )
    )
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
    (read contract-state "default")
  )

  (defun get-validators:[string] ()
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
