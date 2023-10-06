(namespace "free")

(interface validator-iface
    
    (defschema validators
        validator:string
    )
    
    (defschema locations
        validator:string
        storage-location:string    
    )

    (defschema hashes
        known:bool
    )
)