(namespace "free")


(module mock GOVERNANCE

    (defcap GOVERNANCE () true)

    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    (defun mock (encoded-message:string)
        (hyperlane-decode-token-message encoded-message)
    )
)