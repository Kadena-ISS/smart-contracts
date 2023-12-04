(namespace "free")

(interface router-iface

    (defschema modules
        mailbox:module{mailbox-iface}
        igp:module{igp-iface}
    )

    (defschema router-address
        remote-address:string
    )
)