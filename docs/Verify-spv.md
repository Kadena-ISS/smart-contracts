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
