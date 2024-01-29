import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";

async function main() {
  const templateFile = await readFile(
    path.join(__dirname, "../../pact/hyp-erc20-template.pact")
  );

  enum TokenTypes {
    SYNTHETIC,
    COLLATERAL,
    NFT,
  }
  const token_type = TokenTypes.SYNTHETIC;

  let result: string = "";

  if (token_type == TokenTypes.SYNTHETIC) {
    result = await createCollateral(templateFile.toString());
    console.log(result);
  }

  await writeFile(
    path.join(
      __dirname,
      "../../pact/hyp-erc20-collateral/hyp-erc20-collateral.pact"
    ),
    result
  );
}

const createSynthetic = async (file: string) => {
  const moduleName = "hyp-erc20-collateral";

  const nameRegExp = new RegExp("<name>", "g");
  let resultFile = file.replaceAll(nameRegExp, moduleName);

  const stateRegExp = new RegExp("<state-schema>", "g");
  const stateSchema = `syn-state`;
  resultFile = resultFile.replaceAll(stateRegExp, stateSchema);

  const initialize = `(defun initialize (igp:module{igp-iface})
    ; TODO: 
    ;  (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
          "igp": igp
        }
      )
    ;  )
    )`;
  resultFile = resultFile.replace("<initialize>", initialize);

  const transferTo = `(defun transfer-to (receiver:string amount:decimal)
    (with-default-read accounts receiver { "balance": 0.0 } { "balance" := balance }
      (update accounts receiver { "balance": (+ balance amount)})
    )
  )`;
  resultFile = resultFile.replace("<transfer-to>", transferTo);

  const transferFrom = `(defun transfer-from (sender:string amount:decimal)
    (with-default-read accounts sender { "balance": 0.0 } { "balance" := balance }
      (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))
      (update accounts sender { "balance": (- balance amount)})
    )
  )`;
  resultFile = resultFile.replace("<transfer-from>", transferFrom);

  return resultFile;
};

const createCollateral = async (file: string) => {
  const moduleName = "hyp-erc20-collateral";

  const nameRegExp = new RegExp("<name>", "g");
  let resultFile = file.replaceAll(nameRegExp, moduleName);

  const stateRegExp = new RegExp("<state-schema>", "g");
  const stateSchema = `col-state`;
  resultFile = resultFile.replaceAll(stateRegExp, stateSchema);

  const initialize = `(defun initialize (igp:module{igp-iface})
    ; TODO: 
    ;  (with-capability (ONLY_ADMIN)
      (insert contract-state "default"
        {
          "igp": igp
        }
      )
    ;  )
    )`;
  resultFile = resultFile.replace("<initialize>", initialize);

  const transferTo = `(defun transfer-to (receiver:string amount:decimal)
    (with-default-read accounts receiver { "balance": 0.0 } { "balance" := balance }
      (update accounts receiver { "balance": (+ balance amount)})
    )
  )`;
  resultFile = resultFile.replace("<transfer-to>", transferTo);

  const transferFrom = `(defun transfer-from (sender:string amount:decimal)
    (with-default-read accounts sender { "balance": 0.0 } { "balance" := balance }
      (enforce (<= amount balance) (format "Cannot burn more funds than the account has available: {}" [balance]))
      (update accounts sender { "balance": (- balance amount)})
    )
  )`;
  resultFile = resultFile.replace("<transfer-from>", transferFrom);

  return resultFile;
};

main();
