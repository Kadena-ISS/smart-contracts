export const colInitialize = `
  (defun initialize (token:module{fungible-v2} treasury:string)
    (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
          "igp": igp,
          "token": token,
          "treasury": treasury
        }
      )
    )
  )`;

export const colTransferTo = `
  (defun transfer-create-to (receiver:string receiver-guard:guard amount:decimal)
    (with-read contract-state "default"
      {
        "token" := token:module{fungible-v2},
        "treasury" := treasury
      }
      (token::transfer-create treasury receiver receiver-guard amount)
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
