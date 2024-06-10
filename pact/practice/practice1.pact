(namespace "free")

(module practice1 GOVERNANCE

    ;; Interface
    (implements practice1-iface)

    ;; Imports
    (use practice1-iface [balance])

    ;; Schemas
    (defschema practice1-state
        practice2:module{practice2-iface})

    ;; Tables
    (deftable contract-state:{practice1-state})

    (deftable balance-table:{balance}
        @doc "table for balances")

    ;; Capabilities
    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
   
    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    ;; Functions
    (defun initialize (practice2:module{practice2-iface})
        (with-capability (ONLY_ADMIN)
            (insert contract-state "default"
                {
                    "practice2": practice2
                }
            )
        )
    )

    (defun add-balance:bool (name:string entry:object{balance})
        (with-read contract-state "default"
            {
               "practice2" := practice2:module{practice2-iface}
            }
            (require-capability (practice2::ONLY_PRACTICE2))
        )
        (insert balance-table name entry)
        true
    )

    (defun get-balance:object{balance} (name:string)
        (with-read contract-state "default"
            {
               "practice2" := practice2:module{practice2-iface}
            }
            (require-capability (practice2::ONLY_PRACTICE2))
        )
        (read balance-table name)
    )
)

(if (read-msg "init")
  [
    (create-table practice1.contract-state)
    (create-table practice1.balance-table)
  ]
  "upgrade complete")