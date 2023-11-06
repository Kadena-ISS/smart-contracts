# Kadena `verify-spv` functionality

This documents specifies every instance of `verify-spv`

## ValidatorAnnounce

This contract is an auxillary contract for the backend that stores validator signatures.

Reference Solidity code:

```=solidity
// Verify that the signature matches the declared validator
function act(
    address _validator,
    string calldata _storageLocation,
    bytes calldata _signature
) external {
    bytes32 _announcementDigest = getAnnouncementDigest(_storageLocation);
    address _signer = ECDSA.recover(_announcementDigest, _signature);
    require(_signer == _validator, "!signature");                 
}


function getAnnouncementDigest(string memory _storageLocation)
    public
    view
    returns (bytes32)
    {
        return
            ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked(_domainHash(), _storageLocation))
            );
    }
    
function _domainHash() internal view returns (bytes32) {
return
    keccak256(
        abi.encodePacked(
            localDomain,
            address(mailbox).addressToBytes32(),
            "HYPERLANE_ANNOUNCEMENT"
        )
    );
}

function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
}

```

### Solidity behavior

`_domainHash()` is the lowest level function that encodes data, related to current chain, for the future recovery. However, this function can be removed in favor of a pre-computed hash. 

```=solidity
function _domainHash() external view returns (bytes32) {

    uint32 localDomain = 626;
    string memory mailbox = "kb-mailbox";

    return
        keccak256(
            abi.encodePacked(
                localDomain,
                mailbox,
                "HYPERLANE_ANNOUNCEMENT"
            )
        );
}
```
The testing Solidity function above produces the following hash ```0xa69e6ef1a8e62aa6b513bd7d694c6d237164fb04df4e5fb4106e47bf5b5a0428```.
The hash will be supplied to `getAnnouncementDigest` function. 
 
```=solidity
function getAnnouncementDigest(string memory _storageLocation)
    public
    view
    returns (bytes32)
    {
        return
            ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked("0xa69e6ef1a8e62aa6b513bd7d694c6d237164fb04df4e5fb4106e47bf5b5a0428", _storageLocation))
            );
    }
```

The resulting digest is used with `ECDSA.recover`. The result of this operation is the address of the private key that signed this digest.
 
### Expected Pact behavior 

The goal of the `verify-spv` function needed for this module is to perform  `getAnnouncementDigest` and `ECDSA.recover`.

**Input**: `_storageLocation, _signature`
**Output**: `signer:string` - the address of private key that signed the data

## Mailbox

Mailbox has two methods that should be call `verify-spv` function: `dispatch` and `process`

### Expected Pact behavior: Dispatch

The goal of this function is to take an input, perform ABI encoding and return encoded parameters to be transmitted to another chain. Additionally, to create an id for this message, which is `keccak256(encodedString)`

**Input**: 
```
version:integer
nonce:integer
origin:string
destination:string  
sender:string
recipient:string
token-message:TokenMessageERC20
```
**Output**: 
```
encodedString:string
id:string
```

--- 

### Solidity behavior: Process

`process` function performs multiple checks on the function arguments, forwards those arguments to be checked by ISM, and then it is handled by the recipient. Key part here is the ISM verification. Here is provided a modified version of Hyperlane verify function. 

```=solidity
function verify(bytes calldata _metadata, bytes calldata _message, address[] memory _validators, uint8 _threshold)
        public
        view
        returns (bool)
    {
        bytes32 _digest = digest(_metadata, _message);
        
        uint256 _validatorCount = _validators.length;
        uint256 _validatorIndex = 0;
        
        // Assumes that signatures are ordered by validator
        for (uint256 i = 0; i < _threshold; ++i) {
        
            address _signer = ECDSA.recover(_digest, signatureAt(_metadata, i)); //signatureAt - retrieves a signature
            
            // Loop through remaining validators until we find a match
            while (
                _validatorIndex < _validatorCount &&
                _signer != _validators[_validatorIndex]
            ) {
                ++_validatorIndex;
            }
            // Fail if we never found a match
            require(_validatorIndex < _validatorCount, "!threshold");
            ++_validatorIndex;
        }
        return true;
    }
    
    
function digest(bytes calldata _metadata, bytes calldata _message)
        internal
        pure
        override
        returns (bytes32)
    {
        return
            CheckpointLib.digest(
                _message.origin(), //value from HyperlaneMessage
                _metadata.originMerkleTreeAddress(), //value from MessageIdMultisigMetadata 
                _metadata.root(),
                _metadata.index(),
                _message.id()
            );
    }
    
// This function is from CheckpointLib
function digest(
        uint32 _origin,
        bytes32 _originmerkleTreeHook,
        bytes32 _checkpointRoot,
        uint32 _checkpointIndex,
        bytes32 _messageId
    ) internal pure returns (bytes32) {
        bytes32 _domainHash = domainHash(_origin, _originmerkleTreeHook);
        return
            ECDSA.toEthSignedMessageHash(
                keccak256(
                    abi.encodePacked(
                        _domainHash,
                        _checkpointRoot,
                        _checkpointIndex,
                        _messageId
                    )
                )
            );
    }
    
    function domainHash(uint32 _origin, bytes32 _originmerkleTreeHook)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(_origin, _originmerkleTreeHook, "HYPERLANE")
            );
    }
    
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
    
```


### Expected Pact behavior: Process

The goal of this function is to ABI decode a string of encoded values, a string of metadata. These values are used to perform ECDSA recovery of signer from each signature in the array. Those signers should be in an array of validators. The function should return `verified = true` in the case when the number of signers in `validators` array is bigger than `threshold`

**Input**: `metadata:string`, `message:string`, `validators:[string]`, `threshold:integer`
**Output**: `message:HyperlaneMessage`, `id:string`, `verified:bool`