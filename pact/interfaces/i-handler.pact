(namespace "free")

(interface handler-iface

    (defschema token-message
        recipient:string
        amount:decimal
    )

    (defun handle:bool (origin:string sender:string token-message:object{token-message}))    
)

