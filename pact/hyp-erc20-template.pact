(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module <name> GOVERNANCE
  (implements fungible-v2)

  (implements router-iface)

  ;; Imports
  (use hyperlane-message [hyperlane-message])

  (use token-message [token-message])

  (use router-iface [<state-schema> router-address])
  
  ;; Tables
  (deftable accounts:{fungible-v2.account-details})

  (deftable contract-state:{<state-schema>})

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
    (enforce-guard (at "guard" (read accounts sender)))
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

  (defconst VALID_CHAIN_IDS (map (int-to-str 10) (enumerate 0 19))
    "List of all valid Chainweb chain ids"
  )

  <initialize>
  
  (defun precision:integer () 18)

  (defun get-adjusted-amount:decimal (amount:decimal) 
    (* amount (dec (^ 10 (precision))))
  )

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Router ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    
  (defun enroll-remote-router:bool (domain:string address:string)
    ;  (with-capability (ONLY_ADMIN)
      (enforce (!= domain "0") "Domain cannot be zero")
      (insert routers domain
        {
          "remote-address": address
        }
      )
      true
    ;  )
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
    ;  (with-capability (TRANSFER_REMOTE destination sender recipient-tm amount)
    (let
      (
        (receiver-router:string (has-remote-router destination))
      )
      (transfer-from sender amount)
      receiver-router
    )
    ;  ) 
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
          "amount" := amount,
          "chainId" := chainId
        }

        (if (= chainId 0)
          (transfer-to recipient amount)
          (transfer-to-crosschain recipient amount (int-to-str 10 chainId))
        )
        (emit-event (RECEIVED_TRANSFER_REMOTE origin recipient amount))
        true
      )
    )
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; ERC20 ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  <transfer-from>

  <transfer-to>

  (defpact transfer-to-crosschain:string (receiver:string amount:decimal target-chain:string)
    (step
      (with-capability (TRANSFER_TO target-chain)
        (yield { "receiver": receiver, "amount": amount } target-chain)
      )
    )

    (step
      (resume { "receiver" := receiver, "amount" := amount }
        (transfer-to receiver amount)
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

  (defschema transfer-crosschain-schema
    @doc "Schema for yielded (transfer-crosschain) arguments."
    receiver:string
    receiver-guard:guard
    amount:decimal)

  ; Now we can implement the (transfer-crosschain) pact.
  ; https://pact-language.readthedocs.io/en/stable/pact-reference.html#defpact
  (defpact transfer-crosschain:string (sender:string receiver:string receiver-guard:guard target-chain:string amount:decimal)
    ; Pacts are similar to functions, but they happen as multiple distinct
    ; transactions, each represented as a "step".
    ; https://pact-language.readthedocs.io/en/stable/pact-reference.html#step
    ;
    ; These arguments are only available to the first step of the pact; to
    ; continue passing data to subsequent steps it is necessary to "yield" the
    ; data, and then "resume" using the yielded data in the next step.
    ; https://pact-language.readthedocs.io/en/stable/pact-functions.html#yield
    ; https://pact-language.readthedocs.io/en/stable/pact-functions.html#resume
    (step
      (with-capability (TRANSFER sender receiver amount)
        ; Just like how our oracle contract read the block time from the chain
        ; data, we can verify that the user is indeed doing a cross-chain
        ; transfer by reading the chain-id from the chain data.
        ; https://pact-language.readthedocs.io/en/stable/pact-functions.html#chain-data
        (enforce (!= (at "chain-id" (chain-data)) target-chain) "Target chain cannot be current chain.")
        (enforce (!= "" target-chain) "Target chain cannot be empty.")
        (enforce-unit amount)

        ; As with (transfer), our first order of business is to debit funds from
        ; the sender on the current chain.
        (with-read accounts sender { "balance" := sender-balance }
          (enforce (<= amount sender-balance) "Insufficient funds.")
          (update accounts sender { "balance": (- sender-balance amount) }))

        ; Now that we have debited from the sender account there is nothing more
        ; to do on this chain. Thus we "yield" the pact with some data, which
        ; will be passed to next step of the pact on the target chain.
        ; https://pact-language.readthedocs.io/en/stable/pact-functions.html#yield
        (yield
          ; We have to use this somewhat kludgy "let" form in order to specify
          ; a type for the value we are passing through the continuation.
          (let
            ((payload:object{transfer-crosschain-schema}
                { "receiver": receiver
                , "receiver-guard": receiver-guard
                , "amount": amount
                }))
            payload)
          target-chain)))

    (step
      ; In the next step, on the target chain, we can resume the computation by
      ; binding to the data we previously yielded.
      ; https://pact-language.readthedocs.io/en/stable/pact-functions.html#resume
      (resume { "receiver" := receiver, "receiver-guard" := receiver-guard, "amount" := amount }
        ; It is only possible to reach this step having successfully executed
        ; the first part of the pact, so we don't need to request TRANSFER again.
        (with-default-read accounts receiver
          { "balance": 0.0, "guard": receiver-guard }
          { "balance" := receiver-balance, "guard" := existing-guard }
          (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
          (write accounts receiver
            { "balance": (+ receiver-balance amount)
            , "guard": receiver-guard
            , "account": receiver
            })))))
)

(if (read-msg "init")
  [
    (create-table free.<name>.accounts)
    (create-table free.<name>.contract-state)
    (create-table free.<name>.routers)
  ]
  "Upgrade complete")