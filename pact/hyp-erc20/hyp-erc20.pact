(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module hyp-erc20 GOVERNANCE
  (implements fungible-v2)

  (implements router-iface)

  (implements handler-iface)

  ;; Imports
  (use hyperlane-message [hyperlane-message])

  (use handler-iface [token-message])
  
  ;; TODO: When using this message, the code fails
  ;; hyp-erc20.pact:132:50:Error: Argument type mismatch for token-message with handler-iface: found object:(defschema token-message  [recipient:string, amount:decimal]), expected object:free.token-message
  ;  (use token-message [token-message]) 

  (use router-iface [modules router-address]) 
  
  ;; Tables
  (deftable accounts:{fungible-v2.account-details})

  (deftable known-modules:{modules})

  (deftable routers-table:{router-address})

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
    (enforce-guard (at "guard" (read accounts sender)))
    (enforce (> amount 0.0) "Transfer must be positive.")
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

  (defun initialize (mailbox:module{mailbox-iface} igp:module{igp-iface})
    ;  (with-capability (ONLY_ADMIN)
      (insert known-modules "default"
        {
          "mailbox": mailbox,
          "igp": igp
        }
      )
    ;  )
  )

  (defun precision:integer () 12)

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Router ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    
  (defun enroll-remote-router:bool (domain:string address:string)
    ;  (with-capability (ONLY_ADMIN)
      (enforce (!= domain "0") "Domain cannot be zero")
      (insert routers-table domain
        {
          "remote-address": address
        }
      )
      true
    ;  )
  )
  
  (defun has-remote-router:string (domain:string)
    (with-default-read routers-table domain
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

  (defun dispatch-to-mailbox:string (destination:string recipient-tm:string amount:decimal)
    (let
      (
        (router-address:string (has-remote-router destination))
      )
      (with-read known-modules "default"
        {
         "mailbox" := mailbox:module{mailbox-iface}
        }
        (mailbox::dispatch "sender" destination router-address recipient-tm amount) ;; TODO: make sender unique for each router
      )
    )
  )

  (defun handle:bool (origin:string sender:string token-message:object{token-message})
      ;;TODO: implement onlyMailbox
    (let
      (
        (router-address:string (has-remote-router origin))
      )
      (enforce (= sender router-address) "Sender is not router")
      (bind token-message
        {
          "recipient" := recipient,
          "amount" := amount
        }
        (transfer-to recipient amount)
        (emit-event (RECEIVED_TRANSFER_REMOTE origin recipient amount))
        true
      )
    )
  )

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; GasRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  (defun quote-gas-payment:decimal (domain:string)
    (has-remote-router domain)
    (with-read known-modules "default"
      {
        "mailbox" := mailbox:module{mailbox-iface}
      }
      (mailbox::quote-dispatch domain)
    )
  )
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TokenRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  (defun transfer-remote:string (destination:string sender:string recipient-tm:string amount:decimal)
    ;  (with-capability (TRANSFER_REMOTE destination sender recipient-tm amount)
      (transfer-from-sender sender amount)
      ;  (with-capability (INTERNAL)
      ;    (let 
      ;      (
      ;        (message-ID:string (dispatch-to-mailbox destination recipient-tm amount))
      ;      )
      ;      (emit-event (SENT_TRANSFER_REMOTE destination recipient-tm amount))
      ;      message-ID
      ;    )
      ;  )
    ;  ) 
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; ERC20 ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  ;; NOTE: We change this in other contracts
  (defun transfer-from-sender (sender:string amount:decimal)
    (with-capability (INTERNAL)
      (burn-from sender amount)
    )
  )

  (defun burn-from (sender:string amount:decimal)
    ;  (require-capability (INTERNAL))
    (with-default-read accounts sender { "balance": 0.0 } { "balance" := balance }
      (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))
      (update accounts sender { "balance": (- balance amount)})
    )
  )

  ;  ;; NOTE: We change this in other contracts
  (defun transfer-to (receiver:string amount:decimal)
    (with-capability (INTERNAL)
      (mint-to receiver amount)
    )
  )

  (defun mint-to (receiver:string amount:decimal)
    ;  (require-capability (INTERNAL))
    (with-default-read accounts receiver { "balance": 0.0 } { "balance" := balance }
      (update accounts receiver { "balance": (+ balance amount)})
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
        (enforce (<= amount sender-balance) "Insufficient funds.")
        (update accounts sender { "balance": (- sender-balance amount) }))

      (with-read accounts receiver { "balance" := receiver-balance }
        (update accounts receiver { "balance": (+ receiver-balance amount) }))))

  (defun transfer-create:string (sender:string receiver:string receiver-guard:guard amount:decimal)
    @model [ (property (= 0.0 (column-delta accounts "balance"))) ]

    (with-capability (TRANSFER sender receiver amount)
      (with-read accounts sender { "balance" := sender-balance }
        (enforce (<= amount sender-balance) "Insufficient funds.")
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
    (enforce (!= account "") "Account name cannot be empty.")
    (with-read accounts account { "balance" := balance }
      balance
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
    (enforce (!= account "") "Account name cannot be empty.")
    (enforce-guard guard)
    (insert accounts account { "account": account, "balance": 0.0, "guard": guard })
    "Account created!"
  )

  (defun rotate:string (account:string new-guard:guard)
    (enforce (!= account "") "Account name cannot be empty.")
    (with-read accounts account { "guard" := old-guard }
      (enforce-guard old-guard)
      (update accounts account { "guard": new-guard }))
  )

  (defpact transfer-crosschain:string (sender:string receiver:string receiver-guard:guard target-chain:string amount:decimal)
    (step (format "{}" [(enforce false "Cross-chain transfers not supported.")]))
  )
)

(if (read-msg "init")
  [
    (create-table free.hyp-erc20.accounts)
    (create-table free.hyp-erc20.known-modules)
    (create-table free.hyp-erc20.routers-table)
  ]
  "Upgrade complete")
