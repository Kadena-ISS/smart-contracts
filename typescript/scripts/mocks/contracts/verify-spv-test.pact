(namespace "free")

(module verify-spv-mock GOVERNANCE

(defcap GOVERNANCE () true)

(defconst VERSION 3)
(defconst LOCAL_DOMAIN 626)

(defun dispatch (
    router:module{mock-iface} 
    nonce:integer 
    destination:string 
    recipient:string 
    recipient-tm:string 
    amount:decimal
  )
    (bind (verify-spv "HYPERLANE_V3" (prepare-dispatch-parameters nonce (drop -11 (hash router)) destination recipient recipient-tm amount))
       {
          "encodedMessage" := encoded-message,
          "messageId" := id 
       }
       [encoded-message id]
    )
  )

  (defun dispatch-params (
    router:module{mock-iface} 
    nonce:integer 
    destination:string 
    recipient:string 
    recipient-tm:string 
    amount:decimal
  )
    (prepare-dispatch-parameters nonce (drop -11 (hash router)) destination recipient recipient-tm amount)
  )

  (defun prepare-dispatch-parameters (nonce:integer sender:string destination-domain:string recipient:string recipient-tm:string amount:decimal)
    {
      "message": 
      {
        "version": VERSION,
        "nonce": nonce,
        "originDomain": LOCAL_DOMAIN,
        "sender": sender, 
        "destinationDomain": (str-to-int destination-domain),
        "recipient": recipient,
        "tokenMessage": 
        {
          "recipient": recipient-tm,
          "amount": amount,
          "chainId": 0
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