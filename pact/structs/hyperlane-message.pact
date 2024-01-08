(namespace "free")

(interface hyperlane-message

    (defschema hyperlane-message
        version:integer
        nonce:integer
        originDomain:string
        sender:string
        destinationDomain:string  
        recipient:string
        tokenMessage:object{token-message}
    )    
)