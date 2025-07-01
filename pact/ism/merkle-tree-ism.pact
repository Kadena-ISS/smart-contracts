;; AbstractMerkleRootMultisigIsm

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

;; `verify-spv` functions do most of the functionality of ISM.

(module merkle-tree-ism GOVERNANCE
  ;; Interfaces
  (implements ism-iface)

  ;; Imports
  (use hyperlane-message)
  (use ism-iface)

  ;;Tables
  (deftable contract-state:{ism-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))

  (defun initialize:string (validators:[string] threshold:integer)
    (with-capability (ONLY_ADMIN)
      (if (and (= (length validators) (length (distinct validators))) (> threshold 0))
        (insert contract-state "default"
          { "validators": validators, "threshold": threshold })
        "Invalid validators or threshold")))

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
    4)

  (defun validators-and-threshold:object{ism-state} (message:object{hyperlane-message})
    (read contract-state "default"))

  (defun get-validators:[string] (message:object{hyperlane-message})
    (with-read contract-state "default"
      { "validators" := validators }
      validators))

  (defun get-threshold:integer (message:object{hyperlane-message})
    (with-read contract-state "default"
      { "threshold" := threshold }
      threshold)))

(if (read-msg "init")
  [
    (create-table NAMESPACE.merkle-tree-ism.contract-state)
  ]
  "Upgrade complete")
