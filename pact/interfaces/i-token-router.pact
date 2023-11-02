(namespace "free")

(interface token-oracle-iface

    (defun transfer-remote:bool 
        (
            destination:string
            recipient:string
            amountOrId:integer
        )
        @doc "Transfers `_amountOrId` token to `_recipient` on `_destination` domain."
    )
)