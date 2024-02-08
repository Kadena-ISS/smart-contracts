(namespace "free")


(module mock GOVERNANCE

    (defcap GOVERNANCE () true)

    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    (defun mock:string  ()
        (with-capability (ONLY_ADMIN)
            "it works"
        )
    )
)