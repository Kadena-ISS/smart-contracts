;; todo: check whether templates allign with implementations

(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module <name> GOVERNANCE

  (implements router-iface)

  ;; Imports
  (use hyperlane-message [hyperlane-message])

  (use token-message [token-message])

  (use router-iface [col-state router-address])
  
  ;; Tables
  (deftable accounts:{fungible-v2.account-details})

  (deftable contract-state:{col-state})

  (deftable routers:{router-address})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

  (defcap INTERNAL () true)

  (defcap TRANSFER_REMOTE:bool 
    (
      destination:string 
      sender:string
      recipient:string
      amount:decimal
    )
    (enforce (!= destination "0") "Invalid destination")
    (enforce (!= sender "") "Sender cannot be empty.")
    (enforce (!= recipient "") "Recipient cannot be empty.")
    (enforce-unit amount)
    (enforce (> amount 0.0) "Transfer must be positive.")
  )

  (defcap TRANSFER_TO:bool
    (
      target-chain:string 
    )
    (enforce (contains target-chain VALID_CHAIN_IDS) "Invalid target chain ID")
  )


  ;; Events
  (defcap SENT_TRANSFER_REMOTE
    (
      destination:string
      recipient:string
      amount:decimal
    )
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
    @event true
  )

  (defcap RECEIVED_TRANSFER_REMOTE
    (
      origin:string
      recipient:string
      amount:decimal
    )
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
    @event true
  )

  (defcap DESTINATION_GAS_SET
    (
      domain:string
      gas:decimal
    )
    @doc "Emitted when a domain's destination gas is set."
    @event true
  )

  ;; Constants
  (defconst VALID_CHAIN_IDS (map (int-to-str 10) (enumerate 0 19))
    "List of all valid Chainweb chain ids"
  )

  ;; Treasury 
  (defcap COLLATERAL () true)

  (defconst COLLATERAL_ACCOUNT (create-principal (create-treasury-guard)))

  (defun get-collateral-account ()
      COLLATERAL_ACCOUNT
  )
  
  (defun create-treasury-guard:guard ()
    (create-capability-guard (COLLATERAL))
  )

  (defun initialize (token:module{fungible-v2})
    (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
          "igp": igp,
          "mailbox": mailbox,
          "token": token
        }
      )
      (token::create-account COLLATERAL_ACCOUNT (create-treasury-guard))
    )
  )

  (defun precision:integer () 18)

  (defun get-adjusted-amount:decimal (amount:decimal) 
    (* amount (dec (^ 10 (precision))))
  )

  (defun get-collateral-asset ()
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      token
    )
  )

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Router ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    
  (defun enroll-remote-router:bool (domain:string address:string)
    (with-capability (ONLY_ADMIN)
      (enforce (!= domain "0") "Domain cannot be zero")
      (insert routers domain
        {
          "remote-address": address
        }
      )
      true
    )
  )
  
  (defun has-remote-router:string (domain:string)
    (with-default-read routers domain
      {
        "remote-address": "empty"
      }
      {
        "remote-address" := remote-address
      }
      (enforce (!= remote-address "empty") "Remote router is not available.")
      remote-address
    )
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; GasRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  (defun quote-gas-payment:decimal (domain:string)
    (has-remote-router domain)
    (with-read contract-state "default"
      {
        "igp" := igp:module{igp-iface}
      }
      (igp::quote-gas-payment domain)
    )
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TokenRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 
  (defun transfer-remote:string (destination:string sender:string recipient-tm:string amount:decimal)
    (with-capability (TRANSFER_REMOTE destination sender recipient-tm amount)
      (let
        (
          (receiver-router:string (has-remote-router destination))
        )
        (transfer-from sender amount)
        receiver-router
      )
    ) 
  )
  
  (defun handle:bool 
    (
      origin:string 
      sender:string 
      chainId:integer 
      reciever:string 
      receiver-guard:guard 
      amount:decimal
    )
    (with-read contract-state "default"
      {
        "mailbox" := mailbox:module{mailbox-iface}
      }
      (require-capability (mailbox::ONLY_MAILBOX))
    )
    (let
      (
        (router-address:string (has-remote-router origin))
      )
      (enforce (= sender router-address) "Sender is not router")
      (if (= chainId 0)
        (transfer-create-to reciever receiver-guard amount)
        (transfer-create-to-crosschain reciever receiver-guard amount (int-to-str 10 chainId))
      )
      (emit-event (RECEIVED_TRANSFER_REMOTE origin reciever amount))
      true
    )
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; ERC20 ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 
  (defun mint-to (receiver:string amount:decimal)
    (with-default-read accounts receiver { "balance": 0.0 } { "balance" := balance }
      (update accounts receiver { "balance": (+ balance amount)})
    )
  )


  (defun transfer-from (sender:string amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      (token::transfer sender COLLATERAL_ACCOUNT amount)
    )
  )

  
  (defun transfer-create-to (receiver:string receiver-guard:guard amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      (with-capability (COLLATERAL)
        (install-capability (token::TRANSFER COLLATERAL_ACCOUNT receiver amount))
        (token::transfer-create COLLATERAL_ACCOUNT receiver receiver-guard amount)
      )
    )
  )

  (defpact transfer-create-to-crosschain:string (receiver:string receiver-guard:guard amount:decimal target-chain:string)
    (step
      (with-capability (TRANSFER_TO target-chain)
        (yield { "receiver": receiver, "receiver-guard": receiver-guard, "amount": amount } target-chain)
      )
    )

    (step
      (resume { "receiver" := receiver, "receiver-guard" := receiver-guard, "amount" := amount }
        (transfer-create-to receiver receiver-guard amount)
      )
    )
  )

  (defcap TRANSFER:bool (sender:string receiver:string amount:decimal)
    @managed amount TRANSFER-mgr
    (enforce (!= sender receiver) "Sender cannot be the same as the receiver.")
    (enforce (!= sender "") "Sender cannot be empty.")
    (enforce (!= receiver "") "Receiver cannot be empty.")
    (enforce-unit amount)
    (enforce-guard (at 'guard (read accounts sender)))
    (enforce (> amount 0.0) "Transfer must be positive."))

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

    (with-capability (TRANSFER sender receiver amount)
      (with-read accounts sender { "balance" := sender-balance }
        (enforce (<= amount sender-balance) "Insufficient funds TRANSFER.")
        (update accounts sender { "balance": (- sender-balance amount) }))

      (with-read accounts receiver { "balance" := receiver-balance }
        (update accounts receiver { "balance": (+ receiver-balance amount) }))))

  (defun transfer-create:string (sender:string receiver:string receiver-guard:guard amount:decimal)
    @model [ (property (= 0.0 (column-delta accounts "balance"))) ]

    (with-capability (TRANSFER sender receiver amount)
      (with-read accounts sender { "balance" := sender-balance }
        (enforce (<= amount sender-balance) "Insufficient funds TRANSFER_CREATE.")
        (update accounts sender { "balance": (- sender-balance amount) }))

      (with-default-read accounts receiver
        { "balance": 0.0, "guard": receiver-guard }
        { "balance" := receiver-balance, "guard" := existing-guard }
        (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
        (write accounts receiver
          { "balance": (+ receiver-balance amount)
          , "guard": receiver-guard
          , "account": receiver
          }))))

  (defun get-balance:decimal (account:string)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      (token::get-balance account)
    )
  )

  (defun details:object{fungible-v2.account-details} (account:string)
    (enforce (!= account "") "Account name cannot be empty.")
    (read accounts account)
  )

  (defun enforce-unit:bool (amount:decimal)
    (enforce (>= amount 0.0) "Unit cannot be non-negative.")
    (enforce (= amount (floor amount 18)) "Amounts cannot exceed 13 decimal places.")
  )

  (defun create-account:string (account:string guard:guard)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      (token::create-account account guard)
    )
  )

  (defun rotate:string (account:string new-guard:guard)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      (token::rotate account new-guard)
    )
  )

  (defun transfer-crosschain:string (sender:string receiver:string receiver-guard:guard target-chain:string amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2}
      }
      (token::transfer-crosschain sender receiver receiver-guard target-chain amount)
    )
  )


)

(if (read-msg "init")
  [
    (create-table free.<name>.accounts)
    (create-table free.<name>.contract-state)
    (create-table free.<name>.routers)
  ]
  "Upgrade complete")
