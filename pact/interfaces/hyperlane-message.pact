(namespace "free")

(interface hyperlane-message

    (defschema hyperlane-message
        version:integer
        nonce:integer
        originDomain:integer
        sender:string
        destinationDomain:integer  
    )    
)