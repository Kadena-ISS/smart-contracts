(namespace "free")

(enforce-guard (keyset-ref-guard "free.bridge-admin"))

(module igp GOVERNANCE

  (implements igp-iface)
 
  (use igp-iface [igp-state])
 
  ;; Tables
  (deftable contract-state:{igp-state})
  
     
  ;; Capabilities
  (defcap GOVERNANCE () (enforce-guard "free.bridge-admin"))

  ;; Events
  (defcap GAS-PAYMENT
    (

    )
    @doc ""
    @event true
  )

  ;; TODO: transfer funds from user with capability
  (defun pay-for-gas (domain:string gas-amount:decimal)
    (let
        (
            (kda-amount:decimal (quote-gas-payment domain gas-amount))
        )
    )
  )

  ;; An example: we transfer from Kadena to Ethereum
  ;; Gas amount required = 300_000 units
  ;; Gas price = 17 gwei (early morning - low fees)
  ;; Remote tx price = 300_000 * 17_000_000_000 = 5100000 gwei = 5.1e-3 ether (7.92 USD)
  
  ;; ETH price = 1555 USD, Kadena price = 0.41 USD =>
  ;; => Token exchange rate = 1555/0.41 = 3.8e
  ;; Kadena tx price = 5.1e-3 * 3.8e = 19.38 KDA (8.07 USD)

  ;; I have rounded the numbers here and there, so the precision decreased.

  
  (defun quote-gas-payment:decimal (domain:string gas-amount:decimal)
    (with-read contract-state "default"
     {
        "gas-oracle": gas-oracle
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