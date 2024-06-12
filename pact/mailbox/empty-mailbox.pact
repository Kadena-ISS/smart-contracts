(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; NOTICE: This mailbox is used for deployment on any chain except chain 0 to prevent squatting

(module mailbox GOVERNANCE
    
    (implements mailbox-iface)

    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

    (defcap ONLY_MAILBOX:bool () true)
)