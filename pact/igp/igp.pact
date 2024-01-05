(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

;; Manages payments on a source chain to cover gas costs of relaying
;; messages to destination chains and includes the gas overhead per destination

(module igp GOVERNANCE
  (implements igp-iface)
 
  (use igp-iface [igp-state remote-gas-amount-input remote-gas-amount])
 
  ;; Tables
  (deftable contract-state:{igp-state})

  (deftable gas-amount-table:{remote-gas-amount})

  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  (defcap ONLY_ADMIN () (enforce-guard "free.bridge-admin"))

  ;; Events
  (defcap GAS_PAYMENT
    (
      message-id:string
      destination-domain:string
      gas-amount:decimal
      kda-amount:decimal  
    )
    @doc "Emitted when gas payment is transferred to treasury"
    @event true
  ) ;;b

  (defun initialize (gas-oracle:module{gas-oracle-iface} coin:module{fungible-v2} treasury:string)
  ;   (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
         {
            "gas-oracle": gas-oracle,
            "coin": coin,
            "treasury": treasury
         }
      ;  )
    )
  )

  (defun set-remote-gas-amount (config:object{remote-gas-amount-input})
    ;  (with-capability (ONLY_ADMIN)
      (bind config
        {
          "domain" := domain,
          "gas-amount" := gas-amount
        }
        (insert gas-amount-table domain
          {
            "gas-amount": gas-amount
          }
        )
      )
      true
    ;  )
  )

  (defun change-treasury (new-treasury:string)
  ;   (with-capability (ONLY_ADMIN)
      (update contract-state "default"
        {
          "treasury": new-treasury
        }
      )
    ;  )
  )

  ;; An example: we transfer from Kadena to Ethereum
  ;; Gas amount required = 300_000 units
  ;; Gas price = 17 gwei (early morning - low fees)
  ;; Remote tx price = 300_000 * 17_000_000_000 = 5.1e15 wei (7.92 USD)
  
  ;; ETH price = 1555 USD, Kadena price = 0.41 USD =>
  ;; => Token exchange rate = 1555/0.41 = 3.792e3
  ;; Kadena tx price = 5.1e15 * 3.792e3 = 19.33e18 KDA (7.92 USD)

  ;;Another example: we transfer from Kadena to MockChain
  ;; Gas amount required = 2800 units
  ;; Gas price = 0.00051
  ;; Remote tx price = 2.8e3 * 5.1e-4 = 1.428 (0.002856 USD)

  ;; MockChain price = 0.002 USD, Kadena price = 0.52 USD => 
  ;; => Token exchange rate = 0.002 / 0.52 = 3.84e-3
  ;; Kadenx tx price = 1.428 * 3.84e-3 = 0.00548352 (0.002851 USD)
  

  (defun quote-gas-payment:decimal (domain:string)
    (with-read contract-state "default"
     {
        "gas-oracle" := gas-oracle:module{gas-oracle-iface}
     }
     (with-read gas-amount-table domain
        {
          "gas-amount" := gas-amount
        }
        (bind (gas-oracle::get-exchange-rate-and-gas-price domain)
        {
          "token-exchange-rate" := token-exchange-rate,
          "gas-price" := gas-price
        }
        (* (* gas-amount gas-price) token-exchange-rate)
        )
      )
    )     
  )

  (defun pay-for-gas:bool (id:string domain:string gas-amount:decimal)
    (let
      (
        (kda-amount:decimal (quote-gas-payment domain))
      )
      (with-read contract-state "default"
        {
          "coin" := coin:module{fungible-v2},
          "treasury" := treasury:string
        }
        (coin::transfer (at "sender" (chain-data)) treasury kda-amount)
        (emit-event (GAS_PAYMENT id domain gas-amount kda-amount))
      )
      true
    )
  )

)

(if (read-msg "init")
  [ 
    (create-table free.igp.contract-state)
    (create-table free.igp.gas-amount-table)
  ]
  "Upgrade complete")
  