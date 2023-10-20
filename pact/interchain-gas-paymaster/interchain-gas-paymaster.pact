(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module interchain-gas-paymaster GOVERNANCE
    
 ;; Capabilities
 (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))


)