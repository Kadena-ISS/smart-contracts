(namespace "free")

(interface igp-iface

  (defschema igp-state
    gas-oracle:module{gas-oracle-iface}
    coin:module{fungible-v2}
    treasury:string
  )

  (defschema remote-gas-amount-input
    domain:string
    gas-amount:decimal
  )

  (defschema remote-gas-amount
    gas-amount:decimal
  )
  
  (defun pay-for-gas:bool (id:string domain:string gas-amount:decimal)
    @doc "Deposits tokens as a payment for the relaying of a message to its destination chain."
  )

  (defun quote-gas-payment:decimal (domain:string)
    @doc "Quotes the amount of native tokens to pay for interchain gas."
  )
)
  