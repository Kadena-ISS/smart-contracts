(namespace "free")

(interface router-iface

    (use token-message [token-message])


    ;; Synthetic token state
    (defschema syn-state
        igp:module{igp-iface}
    )

    ;; Collateral token state
    (defschema col-state
        igp:module{igp-iface}
        token:module{fungible-v2}
    )

    (defschema router-address
        remote-address:string
    )

    (defun transfer-remote:string (destination:string sender:string recipient-tm:string amount:decimal)
        @doc "TODO"
    )

    (defun handle:bool (origin:string sender:string token-message:object{token-message})
        @doc "Mints or unlocks tokens to recipient when router receives transfer message."
    )
    
    (defun get-adjusted-amount:decimal (amount:decimal) 
        @doc "TODO"
    )
)