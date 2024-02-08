(namespace "free")

(define-keyset "free.test-keyset-3" (read-keyset "bridge-admin"))

(module mock GOVERNANCE

    (defcap GOVERNANCE () true)

    ;  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))
    (defcap ONLY_ADMIN () (enforce-guard "free.test-keyset-3"))

    (defun mock:string  ()
        (enforce-guard "free.test-keyset-3")
            "it works"
    )

    (defun mock_2:string () 
        (format "it works 3" [] )
    )
)