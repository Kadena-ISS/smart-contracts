(namespace "free")

(interface router-iface

    (use token-message [token-message])

    (defschema hyperc20-state
        igp:module{igp-iface}
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
)