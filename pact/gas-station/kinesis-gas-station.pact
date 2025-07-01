(namespace "NAMESPACE") 

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module kinesis-gas-station GOVERNANCE
  ;; Interfaces
  (implements gas-payer-v1)

  ;; Imports 
  (use coin)
  (use guards1)

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

  (defcap GAS_PAYER:bool (user:string limit:integer price:decimal)
    (create-user-guard(coin.gas-only))
    (NAMESPACE.guards1.max-gas-price 0.00000001)
    (NAMESPACE.guards1.max-gas-limit limit)
    (enforce (= "cont" (at "tx-type" (read-msg))) "Can only be used inside an cont tx")
    (compose-capability (ALLOW_GAS)))

  (defcap ALLOW_GAS () true)

  (defun create-gas-payer-guard:guard ()
    (create-user-guard (gas-payer-guard)))

  (defun gas-payer-guard ()
    (require-capability (GAS))
    (require-capability (ALLOW_GAS))))

(if (read-msg "init")
  []
  "Upgrade complete")