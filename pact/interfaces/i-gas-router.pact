(namespace "free")

(interface gas-router-iface

    (defschema destination-gas
        gas:decimal
    )

    (defschema gas-router-cfg
        domain:string
        gas:decimal    
    )
)
