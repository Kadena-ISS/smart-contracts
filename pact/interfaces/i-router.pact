(namespace "free")

(interface router-iface

    (defschema module-connection ;TODO: set up a better name for this schema
        contract-address:string
    )

    (defschema router-address
        domain:string
        contract-address:string
    )
)