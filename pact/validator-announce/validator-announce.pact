(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module validator-announce GOVERNANCE
 
  ;; Imports
  (use validator-iface [validators locations hashes])

  ;; Tables
  (deftable known-validators:{validators})

  (deftable storage-locations:{locations})

  (deftable known-hashes:{hashes})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  ;; Events
  (defcap VALIDATOR_ANNOUNCEMENTS
    (
      validator:string
      storage-location:string
    )
    @doc "Emitted when a new validator announcement is made"
    @event true
  )
  
  ;; TODO: finish with keccak256 and ABI.encode
  (defun announce (validator:string storage-location:string signature:string)
    ;; Check for replay attack
    (with-default-read known-hashes (hash (+ validator storage-location));;TODO:(keccak256 (abi.encode (validator storage-location)))
      {
        "known": false
      }
      {
        "known" := known
      }
      (enforce (= known false) "Hash is known")
      (insert known-hashes (hash (+ validator storage-location)) ;;TODO: introduce let variable that stores hashing results
        {
          "known": true
        }
      ) 
    )
    ;;TODO: enable verifications
    ;  (let
    ;    (
    ;      (digest:string (get-announcement-digest storage-location))
    ;    )
    ;    (let* 
    ;      (
    ;        (signer:string (verify-spv "RECOVER" [digest signature]))
    ;      )
    ;      (enforce (= validator signer)) ;; TODO: add comment
    ;    )
    ;  )
    (insert known-validators validator
      {
        "validator": validator
      }
    )
    (insert storage-locations validator
      {
        "validator": validator,
        "storage-location": storage-location
      }  
    )
    (emit-event (VALIDATOR_ANNOUNCEMENTS validator storage-location))
  )

  (defun get-announced-storage-locations:[[object{locations}]] (validators:[string])
      (map (get-announced-storage-location) validators)
  )

  (defun get-announced-storage-location:[object{locations}] (validator:string)
    (select storage-locations ["announcement"] (where "validator" (= validator)))
  )

  (defun get-announced-validators ()
      (keys known-validators)
  )

  (defun get-announcement-digest:string (storage-location:string)
       ;;(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", (keccak256(get-domain-hash storage-location))))
       (format "digest" []) ;; TODO: replace with the output of toETHSignedMessageHash
  )

  ;  (defun get-domain-hash:string () ;;TODO: implement actual function
  ;      (keccak256)
  ;  )
)

(if (read-msg "init")
  [
    (create-table free.validator-announce.known-validators)
    (create-table free.validator-announce.storage-locations)
    (create-table free.validator-announce.known-hashes)
  ]
  "Upgrade complete")
