(namespace "free")


(module verify-spv-mock GOVERNANCE

(defcap GOVERNANCE () true)

(defun dispatch:[string] (nonce:integer sender:string destination:string recipient:string recipient-tm:string amount:decimal)
    (bind (verify-spv "HYPERLANE_V3" (prepare-dispatch-parameters nonce sender destination recipient recipient-tm amount))
       {
          "encodedMessage" := encoded-message,
          "messageId" := id 
       }
       [encoded-message id]
    )
  )

    (defun prepare-dispatch-parameters (nonce:integer sender:string destination-domain:string recipient:string recipient-tm:string amount:decimal)
      {
       "message": 
       {
          "version": 1, ; integer
          "nonce": nonce, ; integer
          "originDomain": 626, ; integer
          "sender": sender, ; string
          "destinationDomain": (str-to-int destination-domain), ; integer
          "recipient": recipient, ; string
          "tokenMessage": 
          {
            "recipient": recipient-tm, ; string
            "amount": amount ; decimal
          } 
        }
      }
    )

    (defun process (metadata:string encoded-message:string validators:[string] threshold:integer)
        (bind (verify-spv "HYPERLANE_V3" (prepare-process-parameters metadata encoded-message validators threshold))
            {
              "message" := message:{hyperlane-message},
              "messageId" := id
            }
            [id message]
        )
    )
    
    (defun prepare-process-parameters (metadata:string message:string validators:[string] threshold:integer)
        {
          "metadata": metadata,
          "message": message,
          "validators": validators,
          "threshold": threshold
        }
    )

    (defun announce (storageLocation:string signature:string)
        (bind (verify-spv "HYPERLANE_V3" (prepare-announce-parameters storageLocation signature))
            {
                "address" := signer
            }
            signer
        )
    )
    
    (defun prepare-announce-parameters (storageLocation:string signature:string)
        {
          "storageLocation": storageLocation,
          "signature": signature
        }
    )

)