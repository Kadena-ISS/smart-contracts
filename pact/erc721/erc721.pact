(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; TODO: refactor styling and simplify

;;TODO: allign with the hyp-erc20 and hyp-erc20 collateral


(module erc721 GOVERNANCE
  (implements poly-fungible-v1)
  (use fungible-util)

  ;; Tables
  (deftable ledger:{poly-fungible-v1.account-details})

  (defschema issuer
    guard:guard
  )

  (deftable issuers:{issuer})

  (defschema supply
    supply:decimal
    )

  (deftable supplies:{supply})

  (defconst ISSUER_KEY "I")

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  (defcap DEBIT (id:string sender:string)
    (enforce-guard
      (at 'guard
        (read ledger (key id sender)))))

  (defcap CREDIT (id:string receiver:string) true)

  (defcap ISSUE ()
    (enforce-guard (at 'guard (read issuers ISSUER_KEY)))
  )

  (defcap MINT (id:string account:string token:integer)
    @managed ;; one-shot for a given amount
    (compose-capability (ISSUE))
  )

  (defcap BURN (id:string account:string token:integer)
    @managed ;; one-shot for a given amount
    (compose-capability (ISSUE))
  )

  (defcap URI:bool (id:string uri:string) @event true)

  (defcap SUPPLY:bool (id:string supply:decimal) @event true)

  ;; ROUTERS
  (defcap TRANSFER_REMOTE:bool 
    (
      destination:integer 
      sender:string
      recipient:string
      token:integer
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
      token:integer
    )
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
    @event true
  )

  (defcap RECEIVED_TRANSFER_REMOTE
    (
      origin:integer
      recipient:string
      token:integer
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
    
  ;;TODO: add domains(), routers(uint32), enrollRemoteRouter functions

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

  (defun transfer-remote:string (destination:integer sender:string recipient:string token:integer)
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

  (defun init-issuer (guard:guard)
    (insert issuers ISSUER_KEY {'guard: guard})
  )

  (defun key ( id:string account:string )
    (format "{}:{}" [id account])
  )

  (defun total-supply:decimal (id:string)
    (with-default-read supplies id
      { 'supply : 0.0 }
      { 'supply := s }
      s)
  )

  (defcap TRANSFER:bool
    ( id:string
      sender:string
      receiver:string
      token:integer
    )
    @managed amount TRANSFER-mgr
    (enforce-unit id amount)
    (enforce (> amount 0.0) "Positive amount")
    (compose-capability (DEBIT id sender))
    (compose-capability (CREDIT id receiver))
  )

  (defun TRANSFER-mgr:decimal
    ( managed:decimal
      requested:decimal
    )

    (let ((newbal (- managed requested)))
      (enforce (>= newbal 0.0)
        (format "TRANSFER exceeded for balance {}" [managed]))
      newbal)
  )

  (defconst MINIMUM_PRECISION 12)

  (defun enforce-unit:bool (id:string token:integer)
    (enforce
      (= (floor amount (precision id))
         amount)
      "precision violation")
  )

  (defun truncate:decimal (id:string token:integer)
    (floor amount (precision id))
  )


  (defun create-account:string
    ( id:string
      account:string
      guard:guard
    )
    (enforce-valid-account account)
    (insert ledger (key id account)
      { "balance" : 0.0
      , "guard"   : guard
      , "id" : id
      , "account" : account
      })
    )

  (defun get-balance:decimal (id:string account:string)
    (at 'balance (read ledger (key id account)))
    )

  (defun details:object{poly-fungible-v1.account-details}
    ( id:string account:string )
    (read ledger (key id account))
    )

  (defun rotate:string (id:string account:string new-guard:guard)
    (with-read ledger (key id account)
      { "guard" := old-guard }

      (enforce-guard old-guard)

      (update ledger (key id account)
        { "guard" : new-guard }))
    )


  (defun precision:integer (id:string)
    MINIMUM_PRECISION)

  (defun transfer:string
    ( id:string
      sender:string
      receiver:string
      token:integer
    )

    (enforce (!= sender receiver)
      "sender cannot be the receiver of a transfer")
    (enforce-valid-transfer sender receiver (precision id) amount)


    (with-capability (TRANSFER id sender receiver amount)
      (debit id sender amount)
      (with-read ledger (key id receiver)
        { "guard" := g }
        (credit id receiver g amount))
      )
    )

  (defun transfer-create:string
    ( id:string
      sender:string
      receiver:string
      receiver-guard:guard
      token:integer
    )

    (enforce (!= sender receiver)
      "sender cannot be the receiver of a transfer")
    (enforce-valid-transfer sender receiver (precision id) amount)

    (with-capability (TRANSFER id sender receiver amount)
      (debit id sender amount)
      (credit id receiver receiver-guard amount))
    )

  (defun mint:string
    ( id:string
      account:string
      guard:guard
      token:integer
    )
    (with-capability (MINT id account amount)
      (with-capability (CREDIT id account)
        (credit id account guard amount)))
  )

  (defun burn:string
    ( id:string
      account:string
      token:integer
    )
    (with-capability (BURN id account amount)
      (with-capability (DEBIT id account)
        (debit id account amount)))
  )

  (defun debit:string
    ( id:string
      account:string
      token:integer
    )

    (require-capability (DEBIT id account))

    (enforce-unit id amount)

    (with-read ledger (key id account)
      { "balance" := balance }

      (enforce (<= amount balance) "Insufficient funds")

      (update ledger (key id account)
        { "balance" : (- balance amount) }
        ))
    (update-supply id (- amount))
  )


  (defun credit:string
    ( id:string
      account:string
      guard:guard
      token:integer
    )

    (require-capability (CREDIT id account))

    (enforce-unit id amount)

    (with-default-read ledger (key id account)
      { "balance" : 0.0, "guard" : guard }
      { "balance" := balance, "guard" := retg }
      (enforce (= retg guard)
        "account guards do not match")

      (write ledger (key id account)
        { "balance" : (+ balance amount)
        , "guard"   : retg
        , "id"   : id
        , "account" : account
        })

      (update-supply id amount)
      )
    )

  (defun update-supply (id:string token:integer)
    (with-default-read supplies id
      { 'supply: 0.0 }
      { 'supply := s }
      (write supplies id {'supply: (+ s amount)}))
  )

  (defpact transfer-crosschain:string
    ( id:string
      sender:string
      receiver:string
      receiver-guard:guard
      target-chain:string
      token:integer )
    (step (enforce false "cross chain not supported"))
  )

  (defun get-ids ()
    "Get all token identifiers"
    (keys supplies)
  )

  (defun uri:string (id:string) "Unsupported" "")
)

(if (read-msg "init")
  [ (create-table free.erc721.ledger) ]
  "Upgrade complete")
