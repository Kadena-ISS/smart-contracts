(module hasher GOV

    (defcap GOV() (enforce false))

    (defschema message
        version:integer
        nonce:integer
        originDomain:integer
        sender:string
        destinationDomain:integer
    )

    (defun hash-message:string(message:object{message})
        (let 
            (
                (versionString:string (int-to-str 10 (at "version" message)))
                (nonceString:string (int-to-str 10 (at "nonce" message)))
                (senderString:string (at "sender" message))
                (originDomainString:string (int-to-str 10 (at "originDomain" message)))
                (destinationDomainString:string (int-to-str 10 (at "destinationDomain" message)))
            )
            (hash (concat [versionString nonceString originDomainString senderString destinationDomainString]))
        )
    )
)