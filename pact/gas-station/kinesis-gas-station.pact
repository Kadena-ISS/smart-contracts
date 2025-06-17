(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module kinesis-gas-station GOVERNANCE

  ;; Imports
  (implements gas-payer-v1)
  (use coin)
  (use guards1)

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

  (defcap GAS_PAYER:bool
    ( user:string
      limit:integer
      price:decimal
    )
    (enforce (> price 0.0) "Price must be positive")
    (enforce (> limit 0) "Limit must be positive")
    (enforce (!= user "") "User cannot be empty")

    (create-user-guard(coin.gas-only))
    (NAMESPACE.guards1.max-gas-price 0.00000001)
    (NAMESPACE.guards1.max-gas-limit limit)
    (enforce (= "cont" (at "tx-type" (read-msg))) "Can only be used inside an cont tx")
    (compose-capability (ALLOW_GAS))
  )

  (defcap ALLOW_GAS () true)

  (defun create-gas-payer-guard:guard ()
    (create-user-guard (gas-payer-guard))
  )

  (defun gas-payer-guard ()
    (require-capability (GAS))
    (require-capability (ALLOW_GAS))
  )

)
