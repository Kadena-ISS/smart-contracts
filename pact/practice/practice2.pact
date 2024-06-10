(namespace "free")

(module practice2 GOVERNANCE

    ;; Interface
    (implements practice2-iface)

    ;; Imports
    (use practice1-iface [balance])

    ;; Schemas
    (defschema practice2-state
        practice1:module{practice1-iface})

    ;; Tables
    (deftable contract-state:{practice2-state})

    ;; Capabilities
    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
   
    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    (defcap ONLY_PRACTICE2:bool () true)

    ;; Functions
    (defun initialize (practice1:module{practice1-iface})
        (with-capability (ONLY_ADMIN)
            (insert contract-state "default"
                {
                    "practice1": practice1
                }
            )
        )
    )

    (defun add-balance (name:string entry:object{balance})
        (with-read contract-state "default"
            {
               "practice1" := practice1:module{practice1-iface}
            }
            (practice1::add-balance name entry)
        )
    )

    (defun get-balance:object{balance} (name:string)
        (with-read contract-state "default"
            {
               "practice1" := practice1:module{practice1-iface}
            }
            (practice1::get-balance name)
        )
    )
)

(if (read-msg "init")
  [
    (create-table practice2.contract-state)
  ]
  "upgrade complete")