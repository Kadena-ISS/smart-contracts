(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module SYMBOL GOVERNANCE
  ;; Interfaces
  (implements token-iface)

  ;; Imports
  (use token-iface)

  ;; Schema
  (defschema transfer-crosschain-schema
    @doc "Schema for yielded (transfer-crosschain) arguments."
    receiver:string
    receiver-guard:guard
    amount:decimal)

  ;; Tables
  (deftable accounts:{fungible-v2.account-details})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))
  (defcap INTERNAL () true)
  
  (defcap TRANSFER_FROM (sender:string amount:decimal)
    (enforce (!= sender "") "Sender cannot be empty.")
    (enforce-guard (at 'guard (read accounts sender)))
    (enforce-balance sender amount))

  ;; Precision
  (defun precision:integer () PRECISION)

  ;; Token
  (defun transfer-from (sender:string amount:decimal)
    (with-capability (TRANSFER_FROM sender amount)
      (with-default-read accounts sender { "balance": 0.0 } { "balance" := balance }
        (update accounts sender { "balance": (- balance amount)}))))

  (defun TRANSFER_TO (receiver:string receiver-guard:guard amount:decimal chainId:integer)
    (require-capability (router.TRANSFER_TO SYMBOL receiver amount chainId))
    (with-capability (INTERNAL)
      (if (= (int-to-str 10 chainId) (at "chain-id" (chain-data)))
        (transfer-create-to receiver receiver-guard amount)
        (transfer-create-to-crosschain receiver receiver-guard amount (int-to-str 10 chainId)))))

  (defun transfer-create-to (receiver:string receiver-guard:guard amount:decimal)
    (require-capability (INTERNAL))
    (with-default-read accounts receiver
      { "balance": 0.0, "guard": receiver-guard }
      { "balance" := receiver-balance, "guard" := existing-guard }
      (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
      (write accounts receiver
        {
          "balance": (+ receiver-balance amount),
          "guard": receiver-guard,
          "account": receiver
        })))

  (defpact transfer-create-to-crosschain (receiver:string receiver-guard:guard amount:decimal target-chain:string)
    (step
      (do
        (require-capability (INTERNAL))
        (yield { "receiver": receiver, "receiver-guard": receiver-guard, "amount": amount } target-chain)))
    (step
      (resume { "receiver" := receiver, "receiver-guard" := receiver-guard, "amount" := amount }
        (with-capability (INTERNAL)
          (transfer-create-to receiver receiver-guard amount)))))

  (defun enforce-balance (sender:string amount:decimal)
    (with-default-read accounts sender { "balance": 0.0 }
      { "balance" := balance }
      (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))))

  ;; Synthetic
  (defcap TRANSFER:bool (sender:string receiver:string amount:decimal)
    @managed amount TRANSFER-mgr
    (enforce-unit amount)
    (enforce (!= sender receiver) "Sender cannot be the same as the receiver.")
    (enforce (!= sender "") "Sender cannot be empty.")
    (enforce (!= receiver "") "Receiver cannot be empty.")
    (enforce-guard (at 'guard (read accounts sender))))

  (defun TRANSFER-mgr:decimal (managed:decimal requested:decimal)
    (let ((balance (- managed requested)))
      (enforce (>= balance 0.0) (format "TRANSFER exceeded for balance {}" [managed]))
      balance))

  (defun transfer:string (sender:string receiver:string amount:decimal)
    @model
      [ (property (= 0.0 (column-delta accounts "balance")))
        (property (> amount 0.0))
        (property (!= sender receiver))
      ]
    (enforce (> amount 0.0) "transfer amount must be positive")
    (validate-account sender)
    (validate-account receiver)
    (with-capability (TRANSFER sender receiver amount)
      (with-read accounts sender { "balance" := sender-balance }
        (enforce (<= amount sender-balance) "Insufficient funds.")
        (update accounts sender { "balance": (- sender-balance amount) }))
      (with-read accounts receiver { "balance" := receiver-balance }
        (update accounts receiver { "balance": (+ receiver-balance amount) }))))

  (defun transfer-create:string (sender:string receiver:string receiver-guard:guard amount:decimal)
    @model [ (property (= 0.0 (column-delta accounts "balance"))) ]
    (enforce (> amount 0.0) "transfer amount must be positive")
    (validate-account sender)
    (validate-account receiver)
    (with-capability (TRANSFER sender receiver amount)
      (with-read accounts sender { "balance" := sender-balance }
        (enforce (<= amount sender-balance) "Insufficient funds.")
        (update accounts sender { "balance": (- sender-balance amount) }))
      (with-default-read accounts receiver
        { "balance": 0.0, "guard": receiver-guard }
        { "balance" := receiver-balance, "guard" := existing-guard }
        (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
        (write accounts receiver
          { "balance": (+ receiver-balance amount), "guard": receiver-guard, "account": receiver }))))

  (defun get-balance:decimal (account:string)
    (enforce (!= account "") "Account name cannot be empty.")
    (with-read accounts account { "balance" := balance }
      balance))

  (defun details:object{fungible-v2.account-details} (account:string)
    (enforce (!= account "") "Account name cannot be empty.")
    (read accounts account))

  (defun enforce-unit:bool (amount:decimal)
    (enforce (>= amount 0.0) "Unit cannot be non-positive.")
    (enforce (= amount (floor amount (precision))) "Amounts cannot exceed precision."))

  (defun validate-account (account:string)
    @doc "Enforce that an account name conforms to the coin contract minimum and maximum length requirements, as well as the latin-1 character set."
    (enforce
      (is-charset CHARSET_LATIN1 account)
      (format "Account does not conform to the coin contract charset: {}" [account]))
    (let ((account-length (length account)))
      (enforce
        (>= account-length 3)
        (format "Account name does not conform to the min length requirement: {}" [account]))
      (enforce
        (<= account-length 256)
        (format "Account name does not conform to the max length requirement: {}" [account]))))

  (defun create-account:string (account:string guard:guard)
    (enforce-guard guard)
    (enforce (validate-principal guard account) "Non-principal account names unsupported")
    (insert accounts account
      { "account": account, "balance": 0.0, "guard": guard })
      "Account created!")

  (defun rotate:string (account:string new-guard:guard)
    (enforce false
      "Guard rotation for principal accounts not-supported"))

  (defcap TRANSFER_XCHAIN:bool (sender:string receiver:string amount:decimal target-chain:string)
    @managed amount TRANSFER_XCHAIN-mgr
    (enforce-unit amount)
    (enforce (!= (at "chain-id" (chain-data)) target-chain) "Target chain cannot be current chain.")
    (enforce (!= "" target-chain) "Target chain cannot be empty.")
    (enforce (!= sender "") "Invalid sender")
    (enforce-guard (at 'guard (read accounts sender))))

  (defun TRANSFER_XCHAIN-mgr:decimal (managed:decimal requested:decimal)
    (enforce (>= managed requested)
      (format "TRANSFER_XCHAIN exceeded for balance {}" [managed]))
    0.0)

  (defpact transfer-crosschain:string (sender:string receiver:string receiver-guard:guard target-chain:string amount:decimal)
    (step
      (with-capability (TRANSFER_XCHAIN sender receiver amount target-chain)
        (with-read accounts sender { "balance" := sender-balance }
          (enforce (<= amount sender-balance) "Insufficient funds.")
          (update accounts sender { "balance": (- sender-balance amount) }))
        (yield 
          (let 
            ((payload:object{transfer-crosschain-schema}
              { "receiver": receiver, "receiver-guard": receiver-guard, "amount": amount}))
              payload)
          target-chain)))
    (step
      (resume { "receiver" := receiver, "receiver-guard" := receiver-guard, "amount" := amount }
        (with-default-read accounts receiver
          { "balance": 0.0, "guard": receiver-guard }
          { "balance" := receiver-balance, "guard" := existing-guard }
          (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
          (write accounts receiver
            { "balance": (+ receiver-balance amount), "guard": receiver-guard, "account": receiver}))))))

(if (read-msg "init")
  [
    (create-table NAMESPACE.SYMBOL.accounts)
  ]
  "Upgrade complete")
