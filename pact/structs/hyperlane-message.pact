(namespace "free")

(interface hyperlane-message

    (defschema hyperlane-message
        version:integer
        nonce:integer
        origin:string
        destination:string  
        sender:string
        recipient:string
        token-message:object{token-message}
    )    
)