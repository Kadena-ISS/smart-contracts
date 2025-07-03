(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

(module router GOVERNANCE
  ;; Imports
  (use token-iface)
  (use hyperlane-message)
  (use token-message)
  (use mailbox-iface-v2)

  ;; Schemas
  (defschema dependency
    mailbox:module{mailbox-iface-v2})

  (defschema token-hash
    token:module{token-iface})

  (defschema remote-token
    remote-address:string)

  ;; Tables
  (deftable dependencies:{dependency})
  (deftable hashes:{token-hash})
  (deftable remotes:{remote-token})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
  (defcap ONLY_ADMIN () (enforce-guard "NAMESPACE.bridge-admin"))
  (defcap TRANSFER_REMOTE:bool (destination:integer sender:string recipient:string amount:decimal)
    (enforce (!= destination "0") "Invalid destination")
    (enforce (!= recipient "") "Recipient cannot be empty.")
    (enforce (> amount 0.0) "Transfer must be positive."))
  (defcap TRANSFER_TO:bool (token:module{token-iface} recipient:string amount:decimal chainId:integer)
    (enforce (> amount 0.0) "Transfer must be positive.")
    (enforce (and (<= chainId 19) (>= chainId 0)) "Invalid target chain ID"))

  ;; Events
  (defcap RECEIVED_TRANSFER_REMOTE (origin:integer recipient:string amount:decimal)
    @doc "Emitted on `transferRemote` when a transfer message is dispatched"
     @event true)

  ;; Dependencies
  (defun set-mailbox:string (mailbox:module{mailbox-iface-v2})
    @doc "Stores a mailbox module in the dependencies table"
    (with-capability (ONLY_ADMIN)
      (write dependencies "default"
          { "mailbox": mailbox })))

  (defun get-mailbox:module{mailbox-iface-v2} ()
    (with-read dependencies "default"
      { "mailbox" := mailbox:module{mailbox-iface-v2} }
      mailbox))

  ;; Precision
  (defun get-adjusted-amount:decimal (token:module{token-iface} amount:decimal)
    (* amount (dec (^ 10 (token::precision)))))

  (defun get-adjusted-amount-back:decimal (token:module{token-iface} amount:decimal)
      (* amount (dec (^ 10 (- 18 (token::precision))))))
  
  ;; Token hash
  (defun store-token-hash:string (token:module{token-iface})
    @doc "Stores a token in the contract"
    (with-capability (ONLY_ADMIN)
      (write hashes (get-token-hash token)
        { "token": token })))

  (defun get-token-hash:string (token:module{token-iface})
    (base64-encode (take 32 (hash token))))

  (defun get-token:module{token-iface} (token-hash:string)
    (with-read hashes token-hash
      { "token" := token:module{token-iface} } 
      token))
  
  ;; Remote routing
  (defun remotes-key:string (domain:integer token:module{token-iface})
    (int-to-str 10 domain) + ":" + (get-token-hash token))

  (defun enroll-remote-router:bool (domain:integer token:module{token-iface} remote-address:string)
    (with-capability (ONLY_ADMIN)
      (enforce (!= domain 0) "Domain cannot be zero")
      (write remotes (remotes-key domain token)
        { "remote-address": remote-address }))
    true)
  
  (defun has-remote-router:string (domain:integer token:module{token-iface})
    (with-default-read remotes (remotes-key domain token)
      { "remote-address": "empty" }
      { "remote-address" := remote-address }
      (enforce (!= remote-address "empty") "Remote router is not available.")
    remote-address))
  
  ;; Token 
  (defun transfer-remote:string (token:module{token-iface} destination:integer sender:string recipient-tm:string amount:decimal)
    (with-capability (TRANSFER_REMOTE destination sender recipient-tm amount)
      (let ((remote-address:string (has-remote-router destination token)))
        (token::transfer-from sender amount)
        remote-address)))
  
  (defun handle:bool (token:module{token-iface} origin:integer sender:string chainId:integer receiver:string receiver-guard:guard amount:decimal)
    (let ((mailbox:module{mailbox-iface-v2} (get-mailbox)))
      (require-capability (mailbox::POST_PROCESS_CALL token origin sender chainId receiver receiver-guard amount)))
    (let ((remote-address:string (has-remote-router origin token)))
      (enforce (= sender remote-address) "Sender is not router"))
    (with-capability (TRANSFER_TO token receiver (get-adjusted-amount-back token amount) chainId)
      (token::TRANSFER_TO receiver receiver-guard (get-adjusted-amount-back token amount) chainId))
    (emit-event (RECEIVED_TRANSFER_REMOTE origin receiver (get-adjusted-amount-back token amount)))
    true))

(if (read-msg "init")
  [
    (create-table NAMESPACE.router.dependencies)
    (create-table NAMESPACE.router.hashes)
    (create-table NAMESPACE.router.remotes)
  ]
  "Upgrade complete")