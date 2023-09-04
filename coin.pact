(module coin GOV

  @model
  [ (defproperty conserves-mass
      (= (column-delta coin-table 'balance) 0.0))

    (defproperty valid-account (account:string)
      (and
        (>= (length account) 3)
        (<= (length account) 256)))
  ]

    (defcap GOV () (enforce false "No upgrades."))

    ;;Describe schema and table
    (defschema account-schema
      @model [
        ; An account should never have a negative balance.
        (invariant (>= balance 0.0))
      ]
      balance:decimal
      guard:guard)
  
    (deftable accounts_table:{account-schema})
    
    ;;Should be used to register user in the table
    (defun create-account:string (account:string guard:guard)
    @model [ (property (valid-account account)) ]

    (insert accounts_table account
      { "balance": 15.0,
        "guard": guard
      })
    )
    
    ;;Get user balance from the table
    (defun get-balance:decimal (account:string)
      (with-read accounts_table account
        { "balance" := balance,
          "guard" := guard }
          (enforce-guard guard)
        balance
        )
    )

    (defun transfer (from:string to:string amount:decimal)
      @model [
        ; A transfer should never create new money — the table should
        ; contain the same total balance before and after.
        (property (= (column-delta accounts_table 'balance) 0.0))
  
        ; You cannot send funds unless you satisfy the guard associated
        ; with that account. Without this, you could send others' money.
        (property (row-enforced accounts_table "auth" from))
      ]
  
      (enforce (!= from to) "Cannot send to yourself.")
      (enforce (> amount 0.0) "Cannot send negative funds.")
      (with-read accounts_table from { "balance" := from-funds, "auth" := auth }
      (enforce (< amount from-funds) "Sender balance too low")
        (enforce-guard auth)
        (with-read accounts_table to { "balance" := to-funds }
          ; First we debit funds from the sender
          (update accounts_table from { "balance": (- from-funds amount) })
          ; Then we credit funds to the receiver
          (update accounts_table to { "balance": (+ to-funds amount) }))))
  )