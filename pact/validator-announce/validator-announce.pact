(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))


;; ValidatorAnnounce is a special smart contract that is used only by backend.
;; Relayer should have an ability to fetch validator's signatures. This 
;; module stores locations of validator's signatures.

(module validator-announce GOVERNANCE
  
  ;; Schemas
  (defschema validators
    known:bool
  )

  (defschema locations
    storage-location:string    
  )

  (defschema hashes
    known:bool
  )

  ;; Tables
  (deftable known-validators:{validators})

  (deftable storage-locations:{locations})

  (deftable known-hashes:{hashes})

  ;; Capabilities
  ;  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))
  (defcap GOVERNANCE () true)

  ;; Events
  (defcap VALIDATOR_ANNOUNCEMENT
    (
      validator:string
      storage-location:string
    )
    @doc "Emitted when a new validator announcement is made"
    @event true
  )
  
  (defun announce:bool (validator:string storage-location:string signature:string)
    @doc "Announces a validator signature storage location"
    ;; Check for replay attack
    (let
      (
        (current-hash:string (hash (+ validator storage-location)))
      )
      (with-default-read known-hashes current-hash
        {
          "known": false
        }
        {
          "known" := known
        }
        (enforce (= known false) "Hash is known")
        (insert known-hashes current-hash
          {
            "known": true
          }
        ) 
      )
    )

    ;  ;; Verify that the validator is the one who signed the data
    ;  (let
    ;    (
    ;      (signer:string (at "address" (verify-spv "HYPERLANE_V3" (prepare-announce-parameters storage-location signature) )))
    ;    )
    ;    (enforce (= validator signer) "Validator is not signer")
    ;  )

    ;; Check whether we have this validator registered
    (with-default-read known-validators validator
      {
        "known": false
      }
      {
        "known" := known
      }
      (if (= known false) 
        (insert known-validators validator
          {
            "known": true
          }
        )
        "Validator already known"
      )
    )
    
    ;; Store the storage location
    (insert storage-locations validator
      {
        "storage-location": storage-location
      }  
    )
    (emit-event (VALIDATOR_ANNOUNCEMENT validator storage-location))

    true
  )

  (defun get-announced-storage-locations:[[object{locations}]] (validators:[string])
    @doc "Returns a list of all announced storage locations for multiple validators"
    (map (get-announced-storage-location) validators)
  )

  (defun get-announced-storage-location:[object{locations}] (validator:string)
    @doc "Returns a list of all announced storage locations for a single validator"
    [(read storage-locations validator)]
  )

  (defun get-announced-validators:[string] ()
    @doc "Returns a list of validators that have made announcements"
    (keys known-validators)
  )

  (defun prepare-announce-parameters (storageLocation:string signature:string)
      {
        "storageLocation": storageLocation,
        "signature": signature
      }
    )
)

(if (read-msg "init")
  [
    (create-table free.validator-announce.known-validators)
    (create-table free.validator-announce.storage-locations)
    (create-table free.validator-announce.known-hashes)
  ]
  "Upgrade complete")
