import { deployGasOracle } from "./deploy-modules";
import { defineKeyset, deployInterfaces, deployStructs } from "./deploy-utils";
import { IKeypair, createClient } from "@kadena/client";

async function main() {
  const devnet_url = `http://localhost:8080/chainweb/0.0/fast-development/chain/0/pact`;

  const sender00Pk =
    "368820f80c324bbc7c2b0610688a7da43e39f91d118732671cd9c7500ff43cca";
  const sender00Sk =
    "251a920c403ae8c8f65f59142316af3c82b631fba46ddea92ee8c95035bd2898";

  const keys: IKeypair = {
    publicKey: sender00Pk,
    secretKey: sender00Sk,
  };
  const keysetName = "bridge-admin";

  const client = createClient(devnet_url);

  await defineKeyset(client, keys, keysetName);

  await deployStructs(client, keys, keysetName);

  await deployInterfaces(client, keys, keysetName);

  await deployGasOracle(client, keys, keysetName);
}

main();
