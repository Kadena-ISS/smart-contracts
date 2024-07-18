(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; Gas Oracle module stores data needed for determining transaction price
;; on another chain. The values are passed to InterchainGasPayment module (IGP).

(module gas-oracle GOVERNANCE
  (implements gas-oracle-iface)
  
  (use gas-oracle-iface [remote-gas-data-input remote-gas-data])
  ;; Tables
  (deftable gas-data-table:{remote-gas-data})
  
  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.upgrade-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

  ;; Events
  (defcap REMOTE_GAS_DATA_SET
    (
      domain:string
      token-exchange-rate:decimal
      gas-price:decimal
    )
    @doc "Emitted when an entry in `remoteGasData` is set."
    @event true
  )

  (defun set-remote-gas-data-configs:bool (configs:[object{remote-gas-data-input}])
    (map (set-remote-gas-data) configs)
    true
  )

  (defun set-remote-gas-data:bool (config:object{remote-gas-data-input})
    (with-capability (ONLY_ADMIN)
      (bind config
        {
          "domain" := domain,
          "token-exchange-rate" := token-exchange-rate,
          "gas-price" := gas-price
        }
        (insert gas-data-table domain
          {
            "token-exchange-rate": token-exchange-rate,
            "gas-price": gas-price
          }
        )
        (emit-event (REMOTE_GAS_DATA_SET domain token-exchange-rate gas-price))
        true
      )
    )
  )
  
  (defun get-exchange-rate-and-gas-price:object{remote-gas-data} (domain:string)
    (read gas-data-table domain)
  )
)
  
(if (read-msg "init")
  [ (create-table free.gas-oracle.gas-data-table) ]
  "Upgrade complete")

  