export const colInitialize = `(defun initialize (igp:module{igp-iface} token:module{fungible-v2} treasury:string)
    ; TODO: 
    ;  (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
          "igp": igp,
          "token": token,
          "treasury": treasury
        }
      )
    ;  )
  )`;

export const colTransferTo = `(defun transfer-to (receiver:string amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2},
        "treasury" := treasury
      }
      (token::transfer treasury receiver amount)
    )
  )`;

export const colTransferFrom = `(defun transfer-from (sender:string amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2},
        "treasury" := treasury
      }
      (token::transfer sender treasury amount)
    )
  )`;
