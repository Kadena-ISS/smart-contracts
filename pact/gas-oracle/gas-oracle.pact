;; StorageGasOracle

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

;; Gas Oracle module stores data needed for determining transaction price
;; on another chain. The values are passed to InterchainGasPayment module (IGP).

(module gas-oracle GOVERNANCE
  (implements gas-oracle-iface)

  (use gas-oracle-iface)
  ;; Tables
  (deftable gas-data-table:{remote-gas-data})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))

  (defcap ONLY_ORACLE_ADMIN () (enforce-guard "NAMESPACE.gas-oracle-admin"))

  ;; Events
  (defcap REMOTE_GAS_DATA_SET
    (
      domain:integer
      token-exchange-rate:decimal
      gas-price:decimal
    )
    @doc "Emitted when an entry in `remoteGasData` is set."
    @event true

    (enforce (> gas-price 0.0) "Gas-price must be positive")
    (enforce (> token-exchange-rate 0.0) "Token-exchange-rate must be positive")
    (enforce (>= domain 0) "Domain cannot be negative")

  )

  (defun set-remote-gas-data-configs:bool (configs:[object{remote-gas-data-input}])
    (map (set-remote-gas-data) configs)
    true
  )

  (defun set-remote-gas-data:bool (config:object{remote-gas-data-input})
    (with-capability (ONLY_ORACLE_ADMIN)
      (bind config
        {
          "domain" := domain,
          "token-exchange-rate" := token-exchange-rate,
          "gas-price" := gas-price
        }

        (enforce (> gas-price 0.0) "Gas-price must be positive")
        (enforce (> token-exchange-rate 0.0) "Token-exchange-rate must be positive")
        (enforce (>= domain 0) "Domain cannot be negative")

        (write gas-data-table (int-to-str 10 domain)
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

  (defun get-exchange-rate-and-gas-price:object{remote-gas-data} (domain:integer)
    (enforce (>= domain 0) "Domain cannot be negative")
    (read gas-data-table (int-to-str 10 domain))
  )
)

(if (read-msg "init")
  [ (create-table NAMESPACE.gas-oracle.gas-data-table) ]
  "Upgrade complete")
