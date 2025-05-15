(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module hyp-erc20-collateral GOVERNANCE
  (implements router-iface)

  ;; Imports
  (use hyperlane-message)
  (use token-message)
  (use router-iface)
  
  ;; Tables
  (deftable contract-state:{col-state})
  (deftable routers:{router-address})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))

  (defcap INTERNAL () true)

  (defcap TRANSFER_REMOTE:bool 
    (
      destination:integer 
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

  ;; Events
  (defcap RECEIVED_TRANSFER_REMOTE
    (
      origin:integer
      recipient:string
      amount:decimal
    )
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
    @event true
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

  (defun initialize (token:module{fungible-v2, fungible-xchain-v1})
    (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
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

  (defun get-adjusted-amount-back:decimal (amount:decimal) 
    (* amount (dec (^ 10 (- 18 (precision)))))
  )

  (defun get-collateral-asset ()
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2, fungible-xchain-v1}
      }
      token
    )
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Router ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    
  (defun enroll-remote-router:bool (domain:integer address:string)
    (with-capability (ONLY_ADMIN)
      (enforce (!= domain 0) "Domain cannot be zero")
      (write routers (int-to-str 10 domain)
        {
          "remote-address": address
        }
      )
      true
    )
  )
  
  (defun has-remote-router:string (domain:integer)
    (with-default-read routers (int-to-str 10 domain)
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

  (defun quote-gas-payment:decimal (domain:integer)
    (has-remote-router domain)
    (igp.quote-gas-payment domain)
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TokenRouter ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  (defun transfer-remote:string (destination:integer sender:string recipient-tm:string amount:decimal)
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
      origin:integer 
      sender:string 
      chainId:integer 
      reciever:string 
      receiver-guard:guard 
      amount:decimal
    )
    (require-capability (mailbox.ONLY_MAILBOX))
    (let
      (
        (router-address:string (has-remote-router origin))
      )
      (enforce (= sender router-address) "Sender is not router")
      (with-capability (INTERNAL)
        (if (= (int-to-str 10 chainId) (at "chain-id" (chain-data)))
          (transfer-create-to reciever receiver-guard (get-adjusted-amount-back amount))
          (transfer-create-to-crosschain reciever receiver-guard (get-adjusted-amount-back amount) (int-to-str 10 chainId))
        )
      )
      (emit-event (RECEIVED_TRANSFER_REMOTE origin reciever (get-adjusted-amount-back amount)))
      true
    )
  )

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; ERC20 ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

  (defun transfer-from (sender:string amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2, fungible-xchain-v1}
      }
      (token::transfer sender COLLATERAL_ACCOUNT amount)
    )
  )

  (defun transfer-create-to (receiver:string receiver-guard:guard amount:decimal)
    (require-capability (INTERNAL))
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2, fungible-xchain-v1}
      }
      (with-capability (COLLATERAL)
        (install-capability (token::TRANSFER COLLATERAL_ACCOUNT receiver amount))
        (token::transfer-create COLLATERAL_ACCOUNT receiver receiver-guard amount)
      )
    )
  )

  (defun transfer-create-to-crosschain (receiver:string receiver-guard:guard amount:decimal target-chain:string)
    (require-capability (INTERNAL))
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2, fungible-xchain-v1}
      }
      (with-capability (COLLATERAL)
        (install-capability (token::TRANSFER_XCHAIN COLLATERAL_ACCOUNT receiver amount target-chain))
        (token::transfer-crosschain COLLATERAL_ACCOUNT receiver receiver-guard target-chain amount)
      )
    )
  )

  (defun get-balance:decimal (account:string)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2, fungible-xchain-v1}
      }
      (token::get-balance account)
    )
  )

  (defun enforce-unit:bool (amount:decimal)
    (enforce (>= amount 0.0) "Unit cannot be non-positive.")
    (enforce (= amount (floor amount (precision))) "Amounts cannot exceed precision.")
  )
)

(if (read-msg "init")
  [
    (create-table NAMESPACE.hyp-erc20-collateral.contract-state)
    (create-table NAMESPACE.hyp-erc20-collateral.routers)
  ]
  "Upgrade complete")