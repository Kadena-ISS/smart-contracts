(namespace "free")

(interface mock-iface
    
    (defun mock:bool ())
)

(module mock GOVERNANCE

    (implements mock-iface)

    (defcap GOVERNANCE () true)

    (defun mock:bool ()
        true
    )
)