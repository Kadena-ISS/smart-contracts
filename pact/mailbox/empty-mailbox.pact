(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module mailbox GOVERNANCE
    
    (implements mailbox-iface)

    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

    (defcap ONLY_MAILBOX:bool () true)
)