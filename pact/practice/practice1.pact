(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module practice1 GOVERNANCE

    ;; Interface
    (implements practice1-iface)

    (use practice1-iface [balance])

    ;; Tables
    (deftable balance-table:{balance}
      @doc "table for balances")

    ;; Capabilities
    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
   
    ;; Functions
    (defun add-balance (name:string entry:object{balance})
      (insert balance-table name entry))

    (defun get-balance:object{balance} (name:string)
      (read balance-table name))
)