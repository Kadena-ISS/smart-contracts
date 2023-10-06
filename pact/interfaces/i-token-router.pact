(namespace "free")

(interface token-oracle-iface

    (defschema remote-gas-data-input
        domain:integer
        token-exchange-rate:integer
        gas-price:integer
    )
    
    (defschema remote-gas-data
        token-exchange-rate:integer
        gas-price:integer
    )

    (defun transfer-remote:bool 
        (
            destination:integer
            recipient:string
            amountOrId:integer
        )
        @doc "Transfers `_amountOrId` token to `_recipient` on `_destination` domain."
    )

    (defun set-remote-gas-data:bool 
        (config:object{remote-gas-data-input})
        @doc " Sets the remote gas data using the values in `config`"
    )

    (defun get-exchange-rate-and-gas-price:object{remote-gas-data}
        (destinationDomain:string)
        @doc "Returns the stored `remoteGasData` for the `_destinationDomain`"
    )
)