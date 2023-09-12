(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module gas-oracle GOVERNANCE
    (implements gas-oracle-iface)

    (deftable gas-data-table:{gas-oracle-iface.remote-gas-data})
    
    ;; Capabilities
    (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

    (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

    ;; Event
    (defcap REMOTE_GAS_DATA_SET
      (
        domain:string
        token-exchange-rate:integer
        gas-price:integer
      )
      @doc "Emitted when an entry in `remoteGasData` is set."
      @event true
    )

    (defun set-remote-gas-data-configs:bool
      (configs:[object{gas-oracle-iface.remote-gas-data-input}])
        (map (set-remote-gas-data) configs)
        true
    )

    (defun set-remote-gas-data:bool
      (config:object{gas-oracle-iface.remote-gas-data-input})
      (with-capability (ONLY_ADMIN)
        (let
          (
            (domain:string (int-to-str 10 (at "domain" config)))
            (token-exchange-rate:integer (at "token-exchange-rate" config))
            (gas-price:integer (at "gas-price" config))
          )
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
    
    (defun get-exchange-rate-and-gas-price:object{gas-oracle-iface.remote-gas-data}
      (destinationDomain:string)
        (read gas-data-table destinationDomain)
    )
)
  

(if (read-msg "init")
  [ (create-table free.gas-oracle.gas-data-table) ]
  "Upgrade complete")

  