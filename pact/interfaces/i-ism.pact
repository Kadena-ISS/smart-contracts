(namespace "free")

;; KTODO: document which solidity module corresponds with each of these files.
;; KNOTE: this corresponds to AbstractMultiSigIsm in the solidity.
;; we do not have a merkle root multisig ISM.
;; this is not the real ISM interface, this is the "multisig ISM interface",
;; which may not even be necessary for us.
;; the merkle root multisig ISM is necessary for full deployment; some info on
;; it can be found here: https://discord.com/channels/935678348330434570/961710804011458621/1195486240959647905
;; and in the following discussion.
;; notably, the implementation there requires "hooks", which we do not have.
;; KNOTE: we can implement a merkle tree in Pact by limiting the depth of the tree to a constant,
;; see Merkle.sol in hyperlane-monorepo.

(interface ism-iface
  
  (use hyperlane-message [hyperlane-message])

  (defschema ism-state
    validators:[string]
    threshold:integer
  )

  (defschema verify-output
    message:object{hyperlane-message}
    id:string
  )

  (defun verify:object{verify-output} (metadata:string message:string)
    @doc "Provides the Multisig implementation of verifying signatures over a checkpoint related to a specific message ID"
  )

  (defun validators-and-threshold:object{ism-state} ()
    @doc "Returns the set of validators responsible for verifying _message and the number of signatures required"
  )
)
