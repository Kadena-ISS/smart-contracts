export const synInitialize = `(defun initialize ()
    (insert contract-state "default"
        {
        "igp": igp,
        "mailbox": mailbox
        }
    )
  )`;

export const synTransferCreateTo = `(defun transfer-create-to:string (receiver:string receiver-guard:guard amount:decimal)
    (with-default-read accounts receiver
      { 
        "balance": 0.0, 
        "guard": receiver-guard 
      }
      { 
        "balance" := receiver-balance, 
        "guard" := existing-guard 
      }
      (enforce (= receiver-guard existing-guard) "Supplied receiver guard must match existing guard.")
      (write accounts receiver
        { 
          "balance": (+ receiver-balance amount),
          "guard": receiver-guard,
          "account": receiver
        }
      )
    )
  )`;

export const synTransferFrom = `(defun transfer-from (sender:string amount:decimal)
    (with-default-read accounts sender { "balance": 0.0 } { "balance" := balance }
        (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))
        (update accounts sender { "balance": (- balance amount)})
    )
  )`;
export const synGetBalance = `(defun get-balance:decimal (account:string)
    (enforce (!= account "") "Account name cannot be empty.")
    (with-read accounts account { "balance" := balance }
      balance
    )
  )`;
