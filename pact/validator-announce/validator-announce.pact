(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))


;; ValidatorAnnounce is a special smart contract that is used only by backend.
;; Relayer should have an ability to fetch validator's signatures. This 
;; module stores locations of validator's signatures.

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
  (defcap VALIDATOR_ANNOUNCEMENT
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
    (emit-event (VALIDATOR_ANNOUNCEMENT validator storage-location))
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
)

(if (read-msg "init")
  [
    (create-table free.validator-announce.known-validators)
    (create-table free.validator-announce.storage-locations)
    (create-table free.validator-announce.known-hashes)
  ]
  "Upgrade complete")
