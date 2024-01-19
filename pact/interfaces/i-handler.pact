(namespace "free")

(interface handler-iface

    (defschema token-message
        recipient:string
        amount:decimal
    )

    (defun handle:bool (origin:string sender:string token-message:object{token-message})
        @doc "TODO"
    )
)

;; KTODO probably add something like this for dispatch.
(interface sender-iface
    (defun process-hyperlane-tokenmessage:bool (token-message:object{token-message})
        @doc "TODO"
    )
)
