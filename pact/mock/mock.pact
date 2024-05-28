(namespace "free")


(module mailbox GOVERNANCE

    (defcap GOVERNANCE () true)

    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    (defcap PROCESS-MLC (encoded-tm:string recipient:string signers:[string])
        (enforce-verifier "hyperlane_v3_message")
    )

  (defun process-mlc:bool (encoded-tm:string signers:[string])
     @doc "Attempts to deliver HyperlaneMessage to its recipient."
     (with-capability (mailbox.PROCESS-MLC encoded-tm "ab" signers)
        true
     )
  )
)