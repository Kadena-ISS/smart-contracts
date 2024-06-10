(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module practice2 GOVERNANCE

    ;; Schemas
    (defschema practice2-state
        practice1:module{practice1-iface})

    (defun initialize (practice1:module{practice1-iface})
        (with-capability (ONLY_ADMIN)
            "practice1": practice1
        )
    )

    ;; Capabilities
    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
   
    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    ;; Functions
    (defun add-balance (name:string entry:object{practice1::balance})
        (practice1::add-balance name entry)
    )

    (defun get-balance:object{balance} (name:string)
        (practice1::get-balance name)
    )
)