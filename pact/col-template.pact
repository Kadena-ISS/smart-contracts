(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module SYMBOL GOVERNANCE
  ;; Interfaces
  (implements token-iface)

  ;; Imports
  (use token-iface)

  ;; Schemas
  (defschema col-state
    collateral:module{fungible-v2, fungible-xchain-v1})

  ;; Tables
  (deftable contract-state:{col-state})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))
  (defcap INTERNAL () true)

  (defcap TRANSFER_FROM (sender:string amount:decimal)
    (enforce (!= sender "") "Sender cannot be empty.")
    (enforce-guard (get-collateral-guard sender))
    (enforce-balance sender amount))

  ;; Precision
  (defun precision:integer () PRECISION)

  ;; Treasury 
  (defcap COLLATERAL () true)

  (defconst COLLATERAL_ACCOUNT (create-principal (create-treasury-guard)))

  (defun get-collateral-account ()
      COLLATERAL_ACCOUNT)

  (defun create-treasury-guard:guard ()
    (create-capability-guard (COLLATERAL)))

  ;; Initialization
  (defun initialize (collateral:module{fungible-v2, fungible-xchain-v1})
    (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        { "collateral": collateral })
      (collateral::create-account COLLATERAL_ACCOUNT (create-treasury-guard))))

  ;; Token
  (defun transfer-from (sender:string amount:decimal)
    (with-capability (TRANSFER_FROM sender amount)
      (with-read contract-state "default"
        { "collateral" := collateral:module{fungible-v2, fungible-xchain-v1} }
        (collateral::transfer sender COLLATERAL_ACCOUNT amount))))

  (defun TRANSFER_TO (receiver:string receiver-guard:guard amount:decimal chainId:integer)
    (require-capability (router.TRANSFER_TO SYMBOL receiver amount chainId))
    (with-capability (INTERNAL)
      (if (= (int-to-str 10 chainId) (at "chain-id" (chain-data)))
        (transfer-create-to receiver receiver-guard amount)
        (transfer-create-to-crosschain receiver receiver-guard amount (int-to-str 10 chainId)))))

  (defun transfer-create-to (receiver:string receiver-guard:guard amount:decimal)
    (require-capability (INTERNAL))
    (with-read contract-state "default"
      { "collateral" := collateral:module{fungible-v2, fungible-xchain-v1} }
      (with-capability (COLLATERAL)
        (install-capability (collateral::TRANSFER COLLATERAL_ACCOUNT receiver amount))
        (collateral::transfer-create COLLATERAL_ACCOUNT receiver receiver-guard amount))))

  (defun transfer-create-to-crosschain (receiver:string receiver-guard:guard amount:decimal target-chain:string)
    (require-capability (INTERNAL))
    (with-read contract-state "default"
      { "collateral" := collateral:module{fungible-v2, fungible-xchain-v1} }
      (with-capability (COLLATERAL)
        (install-capability (collateral::TRANSFER_XCHAIN COLLATERAL_ACCOUNT receiver amount target-chain))
        (collateral::transfer-crosschain COLLATERAL_ACCOUNT receiver receiver-guard target-chain amount))))

  (defun enforce-balance (sender:string amount:decimal)
    (let ((balance (get-collateral-balance sender)))
      (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))))

  ;; Collateral
  (defun get-collateral-asset ()
    (with-read contract-state "default"
      { "collateral" := collateral:module{fungible-v2, fungible-xchain-v1} }
      collateral))

  (defun get-collateral-guard:guard (account:string)
    (with-read contract-state "default"
      { "collateral" := collateral:module{fungible-v2, fungible-xchain-v1} }
      (at 'guard (collateral::details account))))

  (defun get-collateral-balance:decimal (account:string)
    (with-read contract-state "default"
      { "collateral" := collateral:module{fungible-v2, fungible-xchain-v1} }
      (collateral::get-balance account))))

(if (read-msg "init")
  [
    (create-table NAMESPACE.SYMBOL.contract-state)
  ]
  "Upgrade complete")