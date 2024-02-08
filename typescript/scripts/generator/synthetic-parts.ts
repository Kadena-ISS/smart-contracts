export const synInitialize = `(defun initialize (igp:module{igp-iface})
    ; TODO: 
    ;  (with-capability (ONLY_ADMIN)
    (insert contract-state "default"
        {
        "igp": igp
        }
    )
    ;  )
    )`;

export const synTransferTo = `(defun transfer-to (receiver:string amount:decimal)
    (with-default-read accounts receiver { "balance": 0.0 } { "balance" := balance }
      (update accounts receiver { "balance": (+ balance amount)})
    )
  )`;

export const synTransferFrom = `(defun transfer-from (sender:string amount:decimal)
    (with-default-read accounts sender { "balance": 0.0 } { "balance" := balance }
        (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))
        (update accounts sender { "balance": (- balance amount)})
    )
  )`;
