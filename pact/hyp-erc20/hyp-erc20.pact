; Based on the 
(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module hyp-erc20 GOVERNANCE
  (implements fungible-v2)

  (implements router-iface)

  ;; Imports
  (use hyperlane-message [hyperlane-message])

  (use router-iface [modules router-address]) 
  
  (use gas-router-iface [gas-router-cfg]) 


  ;; Tables
  (deftable accounts:{fungible-v2.account-details})

  (deftable known-modules:{modules})

  (deftable destination-gas-table:{gas-router-cfg})

  (deftable routers-table:{router-address})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

  (defcap INTERNAL () true)

  (defcap TRANSFER_REMOTE:bool 
    (
      destination:integer 
      sender:string
      recipient:string
      amount:decimal
    )
    ;;TODO: check destination tables that the destination is valid
    (enforce (!= sender "") "Sender cannot be empty.")
    (enforce (!= recipient "") "Recipient cannot be empty.")
    (enforce-unit amount)
    (enforce-guard (at 'guard (read accounts sender)))
    (enforce (> amount 0.0) "Transfer must be positive.")
  )

  ;; Events
  (defcap SENT_TRANSFER_REMOTE
    (
      destination:integer
      recipient:string
      amount:decimal
    )
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
    @event true
  )

  (defcap RECEIVED_TRANSFER_REMOTE
    (
      origin:integer
      recipient:string
      amount:decimal
    )
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
    @event true
  )

  (defcap DESTINATION_GAS_SET
    (
      domain:string
      gas:integer
    )
    @doc "Emitted when a domain's destination gas is set."
    @event true
  )

  (defun initialize (mailbox:module{mailbox-iface} igp:module{igp-iface})
    (with-capability (ONLY_ADMIN)
      (insert known-modules "default"
        {
          "mailbox": mailbox,
          "igp": igp
        }
      )
    )
  )

  (defun precision:integer () 12)

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Router ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    
  (defun enroll-remote-router:bool (config:object{router-address})
    (with-capability (ONLY_ADMIN)
      (let
        (
          (domain:string (at "domain" config))
          (contract-address:string (at "contract-address" config))
        )
        (enforce (!= domain "0")) ;;TODO: add comment domain cannot be zero
        (insert routers-table domain
          {
            "contract-address": contract-address
          }
        )
        ;  (emit-event (DESTINATION_GAS_SET domain gas)) ;;TODO: emit corresponding event
        true
      )
    )
  )
  
  (defun has-remote-router:string (domain:string)
    (with-default-read routers-table domain
      {
        "contract-address": "empty"
      }
      {
        "contract-address" := contract-address
      }
      (enforce (!= contract-address "empty") "Account name cannot be empty.")
      contract-address
    )
  )

  (defun dispatch-r (destination:string message-body:string)
    (let
      (
        (router-address:string (has-remote-router destination))
      )
      (with-read known-modules "default"
        {
         "mailbox" := mailbox:module{mailbox-iface}
        }
        (mailbox::dispatch destination router-address message-body)
      )
    )
  )

  (defun handle:bool (origin:string sender:string message:string)
      ;;TODO: implement onlyMailbox
    (let
      (
        (router-address:string (has-remote-router origin))
      )
      (enforce (= sender router-address) (format "Sender is not router"))
      (handle-tr origin message)
    )
  )


    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; GasRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 
  
  (defun set-destination-gas-configs (configs:[object{gas-router-cfg}])
    (map (set-destination-gas-config) configs)
  )

  (defun set-destination-gas-config (config:object{gas-router-cfg})
    (with-capability (ONLY_ADMIN)
      (let
        (
          (domain:string (at "domain" config))
          (gas:integer (at "gas" config))
        )
        (insert destination-gas-table domain
          {
            "gas": gas
          }
        )
        (emit-event (DESTINATION_GAS_SET domain gas))
        true
      )
    )
  )

  (defun quote-gas-payment:decimal (domain:string)
    (has-remote-router domain)
    (with-read known-modules "default"
      {
        "mailbox" := mailbox:module{mailbox-iface}
      }
      (with-read destination-gas-table domain
        {
          "gas" := gas
        }
        (let
          (
            (gas-payment:decimal (mailbox::quote-dispatch domain gas))
          )
          gas-payment
        )
      )
    )
  )
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TokenRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  (defun transfer-remote:string (destination:integer sender:string recipient:string amount:decimal)
    (with-capability (TRANSFER_REMOTE destination sender recipient amount)
      (transfer-from-sender sender amount)
      (let
        (
          (message-body:string "ABI.encode(recipient amount)") ;TODO: use actual encoding
        )
        (let* 
          (
            (message-ID:string (dispatch-r destination message-body))
          )
          (emit-event (SENT_TRANSFER_REMOTE destination recipient amount))
          message-ID
          
        )
      )
    ) 
  )

  (defun handle-tr (origin:decimal message:string)
    (with-capability (INTERNAL)
      (let
        (
          (message-obj:object{hyperlane-message} (verify-spv "HYPMSG" message))
        )
        (bind message-obj
          {
            "origin" := origin,
            "recipient" := recipient,
            "amount" := amount
          }
          (transfer-to recipient amount)
          (emit-event (RECEIVED_TRANSFER_REMOTE origin recipient amount))
        )
      )
    )
  )
  
  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; ERC20 ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  ;; TODO: May return metadata to be used in handle
  ;; NOTE: We change this in other contracts
  (defun transfer-from-sender (sender:string amount:decimal)
    (with-capability (INTERNAL)
      (burn-from sender amount)
    )
  )

  (defun burn-from (sender:string amount:decimal)
    (require-capability (INTERNAL))
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
    (require-capability (INTERNAL))
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

  (defcap MINT:bool (receiver:string amount:decimal)
    @managed amount MINT-mgr
    (enforce-guard (keyset-ref-guard "free.bridge-admin"))
    (enforce (!= receiver "") "Receiver cannot be empty.")
    (enforce-unit amount)
    (enforce (> amount 0.0) "Mint limit must be positive."))

  (defun MINT-mgr:decimal (managed:decimal requested:decimal)
    (let ((balance (- managed requested)))
      (enforce (>= balance 0.0) (format "MINT exceeded for balance {}" [managed]))
      balance))

  (defcap BURN:bool (burner:string amount:decimal)
    @managed amount BURN-mgr
    (enforce (!= burner "") "Receiver cannot be empty.")
    (enforce-unit amount)
    (enforce (> amount 0.0) "Burn limit must be positive.")
    (with-read accounts burner { "guard" := guard }
      (enforce-guard guard)))

  (defun BURN-mgr:decimal (managed:decimal requested:decimal)
    (let ((balance (- managed requested)))
      (enforce (>= balance 0.0) (format "BURN exceeded for balance {}" [managed]))
      balance))

  (defun mint (receiver:string receiver-guard:guard amount:decimal)
    (with-capability (MINT receiver amount)
      (with-default-read accounts receiver
        { "balance": 0.0, "guard": receiver-guard }
        { "balance" := receiver-balance, "guard" := existing-guard }
        (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
        (write accounts receiver
          { "balance": (+ receiver-balance amount)
          , "guard": receiver-guard
          , "account": receiver
          }))))

  (defun burn:string (burner:string amount:decimal)
    (with-capability (BURN burner amount)
      (with-default-read accounts burner { "balance": 0.0 } { "balance" := balance }
        (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))
        (update accounts burner { "balance": (- balance amount)}))))


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
    (create-table free.hyp-erc20.destination-gas-table)
  ]
  "Upgrade complete")
