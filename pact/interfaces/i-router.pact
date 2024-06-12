(namespace "free")

(interface router-iface

    (use token-message [token-message])

    ;; Synthetic token state
    (defschema syn-state
        igp:module{igp-iface}
        mailbox:module{mailbox-iface}
    )

    ;; Collateral token state
    (defschema col-state
        igp:module{igp-iface}
        mailbox:module{mailbox-iface}
        token:module{fungible-v2}
    )

    (defschema router-address
        remote-address:string
    )

    (defun transfer-remote:string (destination:string sender:string recipient-tm:string amount:decimal)
        @doc "TODO: finish docs"
    )

    (defun handle:bool (origin:string sender:string chainId:integer reciever:string receiver-guard:guard amount:decimal)
        @doc "Mints or unlocks tokens to recipient when router receives transfer message."
    )
    
    (defun get-adjusted-amount:decimal (amount:decimal) 
        @doc "TODO: finish docs"
    )
)