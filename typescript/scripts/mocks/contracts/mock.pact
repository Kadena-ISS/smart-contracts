(namespace "free")


(module mock GOVERNANCE

    (defcap GOVERNANCE () true)

    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    (defschema decoded-token-message
        recipient:keyset
        amount:decimal
        chainId:integer
    )

    (defun mock (message:string)
        (bind (hyperlane-decode-token-message message)
            {
                "recipient" := recipient,
                "amount" := amount,
                "chainId" := chainId
            }
            {
                "recipient": recipient,
                "amount": (format "{}" [(* amount 1.0)]),
                "chainId": (str-to-int chainId)
            }
        )
    )
)