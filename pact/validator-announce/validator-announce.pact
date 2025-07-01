;; ValidatorAnnounce

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))


;; ValidatorAnnounce is a special smart contract that is used only by backend.
;; Relayer should have an ability to fetch validator's signatures. This 
;; module stores locations of validator's signatures.

(module validator-announce GOVERNANCE
  ;; Schemas
  (defschema validators
    known:bool)

  (defschema locations
    storage-location:string)

  (defschema hashes
    known:bool)

  ;; Tables
  (deftable known-validators:{validators})
  (deftable storage-locations:{locations})
  (deftable known-hashes:{hashes})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))

  ;; Events
  (defcap VALIDATOR_ANNOUNCEMENT (validator:string storage-location:string)
    @doc "Emitted when a new validator announcement is made"
    @event true)
  
  (defun announce:bool (validator:string storage-location:string signature:string)
    @doc "Announces a validator signature storage location"
    (with-capability (ONLY_ADMIN)
      (let ((current-hash:string (hash (+ validator storage-location))))
        (with-default-read known-hashes current-hash
          { "known": false }
          { "known" := known }
          (enforce (= known false) "Hash is known")
          (insert known-hashes current-hash
            { "known": true })))
      ;; Check whether we have this validator registered
      (with-default-read known-validators validator
        { "known": false }
        { "known" := known }
        (if (= known false) 
          (insert known-validators validator
            { "known": true })
          "Validator already known")) 
      ;; Store the storage location
      (insert storage-locations validator
        { "storage-location": storage-location })
      (emit-event (VALIDATOR_ANNOUNCEMENT validator storage-location)))
    true)

  (defun get-announced-storage-locations:[[string]] (validators:[string])
    @doc "Returns a list of all announced storage locations for multiple validators"
    (map (get-announced-storage-location) validators))

  (defun get-announced-storage-location:[string] (validator:string)
    @doc "Returns a list of all announced storage locations for a single validator"
    (if (contains validator (keys storage-locations))
      [(with-read storage-locations validator { "storage-location" := storage-location}
        storage-location
      )]
      []))

  (defun get-announced-validators:[string] ()
    @doc "Returns a list of validators that have made announcements"
    (keys known-validators)))

(if (read-msg "init")
  [
    (create-table NAMESPACE.validator-announce.known-validators)
    (create-table NAMESPACE.validator-announce.storage-locations)
    (create-table NAMESPACE.validator-announce.known-hashes)
  ]
  "Upgrade complete")