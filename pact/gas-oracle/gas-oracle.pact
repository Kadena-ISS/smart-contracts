;; StorageGasOracle

(namespace "NAMESPACE")

(enforce-guard (keyset-ref-guard "NAMESPACE.bridge-admin"))

;; Gas Oracle module stores data needed for determining transaction price
;; on another chain. The values are passed to InterchainGasPayment module (IGP).

(module gas-oracle GOVERNANCE
  ;; Schemas
  (defschema remote-gas-data-input
    domain:integer
    token-exchange-rate:decimal
    gas-price:decimal)

  (defschema remote-gas-data
    token-exchange-rate:decimal
    gas-price:decimal)

  ;; Tables
  (deftable gas-data-table:{remote-gas-data})
  
  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "NAMESPACE.upgrade-admin"))
  (defcap ONLY_ORACLE_ADMIN () (enforce-guard "NAMESPACE.gas-oracle-admin"))

  ;; Events
  (defcap REMOTE_GAS_DATA_SET (domain:integer token-exchange-rate:decimal gas-price:decimal)
    @doc "Emitted when an entry in `remoteGasData` is set."
    @event true)

  (defun set-remote-gas-data-configs:bool (configs:[object{remote-gas-data-input}])
    (map (set-remote-gas-data) configs)
    true)

  (defun set-remote-gas-data:bool (config:object{remote-gas-data-input})
    (with-capability (ONLY_ORACLE_ADMIN)
      (bind config
        { "domain" := domain, "token-exchange-rate" := token-exchange-rate, "gas-price" := gas-price }
        (write gas-data-table (int-to-str 10 domain)
          { "token-exchange-rate": token-exchange-rate, "gas-price": gas-price })
        (emit-event (REMOTE_GAS_DATA_SET domain token-exchange-rate gas-price))
        true)))
  
  (defun get-exchange-rate-and-gas-price:object{remote-gas-data} (domain:integer)
    (read gas-data-table (int-to-str 10 domain))))
  
(if (read-msg "init")
  [ (create-table NAMESPACE.gas-oracle.gas-data-table) ]
  "Upgrade complete")

  