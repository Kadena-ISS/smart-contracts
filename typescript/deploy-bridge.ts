import {
  deployGasOracle,
  deployIGP,
  deployISM,
  deployMailbox,
  deployValidatorAnnounce,
} from "./deploy-modules";
import { deployInterfaces, deployStructs } from "./deploy-utils";
import { IKeypair, createClient } from "@kadena/client";
import {
  IAccountWithPublicKey,
  defineKeyset,
  fundAccount,
} from "./kadena-utils";

async function main() {
  const devnet_url = `http://localhost:8080/chainweb/0.0/fast-development/chain/0/pact`;

  const s_keys: IKeypair = {
    publicKey:
      "368820f80c324bbc7c2b0610688a7da43e39f91d118732671cd9c7500ff43cca",
    secretKey:
      "251a920c403ae8c8f65f59142316af3c82b631fba46ddea92ee8c95035bd2898",
  };

  const b_keys: IKeypair = {
    publicKey:
      "f833278f8825f553c5dcde489af6b982d873947375130ab452a6b6bee071a059",
    secretKey:
      "9396ad2d586b90a7d4a1ab2a0cc55e9d04fc6df7ff7c9c9f41cc8c2cbe3a4d0c",
  };

  const b_account: IAccountWithPublicKey = {
    name: "bridge-admin",
    publicKey: b_keys.publicKey,
  };

  const sender00Keyset = "ks";
  const bridgeAdminKeyset = "bridge-admin";

  const client = createClient(devnet_url);

  console.log('Defining keyset "sender00"');
  // await defineKeyset(client, s_keys, sender00Keyset, "sender00");

  // await fundAccount(client, s_keys, sender00Keyset, b_account, 100);

  console.log('Defining keyset "bridge-admin"');
  await defineKeyset(client, b_keys, bridgeAdminKeyset, "bridge-admin");

  // console.log("\nDeploying structs");
  // await deployStructs(client, s_keys, sender00Keyset);

  // console.log("\nDeploying coin");
  // await deployCoin(client, s_keys, sender00Keyset);

  // console.log("\nDeploying interfaces");
  // await deployInterfaces(client, s_keys, sender00Keyset);

  // console.log("\nDeploying GasOracle");
  // await deployGasOracle(client, s_keys, sender00Keyset);

  // console.log("\nDeploying ValidatorAnnounce");
  // await deployValidatorAnnounce(client, s_keys, sender00Keyset);

  // console.log("\nDeploying ISM");
  // await deployISM(client, s_keys, sender00Keyset, 1);

  // console.log("\nDeploying IGP");
  // await deployIGP(client, s_keys, sender00Keyset);

  // console.log("\nDeploying Mailbox");
  // await deployMailbox(client, s_keys, sender00Keyset);
}

main();
