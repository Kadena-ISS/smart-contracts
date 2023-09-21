(namespace "free")

(module router GOVERNANCE
    (implements router-iface)

    ;; Tables
    (deftable connections-table:{router-iface.module-connections})

    
)

(if (read-msg "init")
  [ (create-table free.router.connections) ]
  "Upgrade complete")
