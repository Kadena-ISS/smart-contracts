;; AbstractMessageIdMultisigIsm

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module message-id-ism GOVERNANCE

  (implements ism-iface)

  (use hyperlane-message)
  (use ism-iface)

  ;;Tables
  (deftable contract-state:{ism-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))

  (defun initialize:string (validators:[string] threshold:integer)
    (enforce (> (length validators) 0) "Empty list of validators is not allowed")
    (enforce (> threshold 0) "Threshold must be positive")
    (enforce (= (length validators) (length (distinct validators))) "Validators needs to be unique")

    (with-capability (ONLY_ADMIN)
          (insert contract-state "default"
            {
                "validators": validators,
                "threshold": threshold
            }
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

  (defun validators-and-threshold:object{ism-state} (message:object{hyperlane-message})
    (read contract-state "default")
  )

  (defun get-validators:[string] (message:object{hyperlane-message})
    (with-read contract-state "default"
      {
        "validators" := validators
      }
      validators
    )
  )

  (defun get-threshold:integer (message:object{hyperlane-message})
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
    (create-table NAMESPACE.message-id-ism.contract-state)
  ]
  "Upgrade complete")
