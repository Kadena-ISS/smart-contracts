(namespace "free")

(interface mailbox-state-iface

    (defschema mailbox-state
        nonce:integer
        latest-dispatched-id:string
        ism:module{ism-iface}
        igp:module{igp-iface}
        hook:module{hook-iface}
     )

     (defschema delivery
        block-number:integer
     )
     (defschema router-hash
        router-ref:module{router-iface}  
     )
)