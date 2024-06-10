(namespace "free")

(interface practice1-iface

    ;; Tables
    (defschema balance
        @doc "schema for balance table"
        name:string
        amount:integer
    )

    ;; Functions
    (defun add-balance:bool (name:string entry:object{balance})
        @doc "add entry to balance-table")

    (defun get-balance:object{balance} (name:string)
        @doc "return entry from balance-table")

)
