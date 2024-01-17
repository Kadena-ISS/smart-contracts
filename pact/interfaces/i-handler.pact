(namespace "free")

(interface handler-iface

    (use token-message [token-message])

    (defun handle:bool (origin:string sender:string token-message:object{token-message})
        @doc "Mints or unlocks tokens to recipient when router receives transfer message."
    )    
)

