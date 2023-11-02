(namespace "free")

(interface validator-iface
    
    (defschema validators
        known:bool
    )
    
    (defschema locations
        storage-location:string    
    )

    (defschema hashes
        known:bool
    )

    (defun announce:bool (validator:string storage-location:string signature:string)
        @doc "Announces a validator signature storage location")

    (defun get-announced-storage-locations:[[object{locations}]] (validators:[string])
        @doc "Returns a list of all announced storage locations for multiple validators")

    (defun get-announced-storage-location:[object{locations}] (validator:string)
        @doc "Returns a list of all announced storage locations for a single validator")

    (defun get-announced-validators ()
        @doc "Returns a list of validators that have made announcements")
)