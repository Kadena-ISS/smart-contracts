(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; TODO: add general overview

(module ism GOVERNANCE
  ;; TODO: implement ism-iface
  (implements ism-iface)

  (use ism-iface [ism-state])

  ;;Tables
  (deftable contract-state:{ism-state})

  ;;TODO: allow changing
  (defconst THRESHOLD 5)

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  ;  (defun validators-and-threshold:[[string], integer] ()
  ;    [["a"], 5]
  ;  )

  ;  (defun get-known-validators:[string] ()
  ;    (keys known-validators)
  ;  )

  (defun get-threshold:integer ()
    THRESHOLD
  )
)

(if (read-msg "init")
  [
    (create-table free.ism.contract-state)
  ]
  "Upgrade complete")
