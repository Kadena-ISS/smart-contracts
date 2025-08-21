(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module coin-faucet GOVERNANCE

  "'coin-faucet' represents Kadena's Coin Faucet Contract."

  (implements gas-payer-v1)

  (use coin)

  (defconst GOVERNANCE_KEYSET (enforce-guard "NAMESPACE.bridge-admin"))

  (defcap GOVERNANCE()
    (enforce-guard "NAMESPACE.bridge-admin")
  )

  (defcap ALLOW_FUNDING () true)

  (defconst FAUCET_ACCOUNT (create-principal (create-gas-payer-guard)))

  (defun get-faucet-account ()
    FAUCET_ACCOUNT
  )

  (defun init ()
    (coin.create-account FAUCET_ACCOUNT (create-gas-payer-guard))
  )

  ; --------------------------------------------------------------------------
  ; Gas station
  ; --------------------------------------------------------------------------

  (defun chain-gas-price ()
    (at 'gas-price (chain-data))
  )

  (defun enforce-below-or-at-gas-price:bool (gasPrice:decimal)
    (enforce (>= gasPrice 0.0) "Gas Price cannot be negative")

    (enforce (<= (chain-gas-price) gasPrice)
      (format "Gas Price must be smaller than or equal to {}" [gasPrice]))
  )

  (defcap GAS_PAYER:bool
    ( user:string
      limit:integer
      price:decimal
    )
    @doc
    " Provide a capability indicating that declaring module supports \
    \ gas payment for USER for gas LIMIT and PRICE. Functionality \
    \ should require capability (coin.FUND_TX), and should validate \
    \ the spend of (limit * price), possibly updating some database \
    \ entry. \
    \ Should compose capability required for 'create-gas-payer-guard'."
    ;  @model
    ;  [ (property (user != ""))
    ;    (property (limit > 0))
    ;    (property (price > 0.0))
    ;  ]

    (enforce (> price 0.0) "Price must be positive")
    (enforce (> limit 0) "Limit must be positive")
    (enforce (!= user "") "User cannot be empty")

    (let ((tx-type:string (read-msg "tx-type"))
          (exec-code:[string] (read-msg "exec-code"))
          (formatted (format "({}.{}." [ NS "coin-faucet" ]))
          )
      (enforce (= "exec" tx-type) "Can only be used inside an exec")
      (enforce (= 1 (length exec-code)) "Can only be used to call one pact function")
      (enforce (= formatted (take (length formatted) (at 0 exec-code))) "only coin faucet smart contract")
    )

    (enforce-below-or-at-gas-price 0.0000001)
    (compose-capability (ALLOW_FUNDING))
  )

  (defconst NS:string "NAMESPACE")

  (defun create-gas-payer-guard:guard ()
    @doc
    " Provide a guard suitable for controlling a coin account that can \
    \ pay gas via GAS_PAYER mechanics. Generally this is accomplished \
    \ by having GAS_PAYER compose an unparameterized, unmanaged capability \
    \ that is required in this guard. Thus, if coin contract is able to \
    \ successfully acquire GAS_PAYER, the composed 'anonymous' cap required \
    \ here will be in scope, and gas buy will succeed."
    (create-capability-guard (ALLOW_FUNDING))
  )

  ; --------------------------------------------------------------------------
  ; Schemas and Tables
  ; --------------------------------------------------------------------------

  (defschema history
    @doc "Table to record the behavior of addresses. Last transaction time,       \
    \ total coins earned, and total coins returned are inserted or updated at     \
    \ transaction. "
    total-coins-earned:decimal
    total-coins-returned:decimal
    last-request-time:time
    )

  (deftable history-table: {history})

  ; --------------------------------------------------------------------------
  ; Constants
  ; --------------------------------------------------------------------------

  (defconst MAX_COIN_PER_REQUEST:decimal 100.0)
  (defconst WAIT_TIME_PER_REQUEST 1800.0)
  (defconst EPOCH (time "1970-01-01T00:00:00Z"))

  ; --------------------------------------------------------------------------
  ; Coin Faucet Contract
  ; --------------------------------------------------------------------------
  (defun request-coin:string (address:string amount:decimal)
    (enforce (!= address "") "Address cannot be empty")
    (enforce (> amount 0.0) "Amount must be positive")

    (enforce (<= amount MAX_COIN_PER_REQUEST)
      "Has reached maximum coin amount per request")

    (with-capability (ALLOW_FUNDING)
      (install-capability (coin.TRANSFER FAUCET_ACCOUNT address amount))
      (transfer FAUCET_ACCOUNT address amount))

    (with-default-read history-table address
      { "total-coins-earned": 0.0,
      "total-coins-returned": 0.0,
      "last-request-time": EPOCH
      }
      { "total-coins-earned":= total-coins-earned,
        "total-coins-returned":= total-coins-returned,
        "last-request-time":= last-request-time
      }

      (enforce (>= (diff-time (curr-time) last-request-time) WAIT_TIME_PER_REQUEST)
        "Coin can be requested every 30 minutes")

      (let  (( total-coins (+ amount total-coins-earned)))

        (write history-table address {
          "total-coins-earned": total-coins,
          "total-coins-returned": total-coins-returned,
          "last-request-time": (curr-time) }))))

  (defun create-and-request-coin:string (address:string address-guard:guard amount:decimal)
    @doc "Transfers AMOUNT of coins up to MAX_COIN_PER_REQUEST from the faucet    \
    \ account to the requester account at ADDRESS. Inserts or updates the         \
    \ transaction of the account at ADDRESS in history-table. Limits the number   \
    \ of coin requests by time, WAIT_TIME_PER_REQUEST "
    @model [(property (<= amount MAX_COIN_PER_REQUEST))]

    (enforce (!= address "") "Address cannot be empty")
    (enforce (> amount 0.0) "Amount must be positive")

    (enforce (<= amount MAX_COIN_PER_REQUEST)
      "Has reached maximum coin amount per request")

      (with-capability (ALLOW_FUNDING)
        (install-capability (coin.TRANSFER FAUCET_ACCOUNT address amount))
        (transfer-create FAUCET_ACCOUNT address address-guard amount))
      (insert history-table address {
        "total-coins-earned": amount,
        "total-coins-returned": 0.0,
        "last-request-time": (curr-time) }))

  (defun return-coin:string (address:string amount:decimal)
    @doc "Returns the AMOUNT of coin from account at ADDRESS back to the faucet   \
    \ account after use. Updates the transaction of the account at ADDRESS in     \
    \ history-table keep track of behavior. "
    @model [(property (> amount 0.0))]

    (enforce (!= address "") "Address cannot be empty")
    (enforce (> amount 0.0) "Amount must be positive")

    (with-read history-table address
      {"total-coins-returned":= coins-returned}
      (transfer address FAUCET_ACCOUNT amount)
      (update history-table address
        {"total-coins-returned": (+ amount coins-returned)})))

  (defun read-history:object{history} (address:string)
    @doc "Returns history of the account at ADDRESS"

    (enforce (!= address "") "Address cannot be empty")
    (read history-table address))

  (defun curr-time ()
    (at 'block-time (chain-data)))
)

(if (read-msg "init")
  [
    (create-table history-table)
    (init)
  ]
  "Upgrade complete")
