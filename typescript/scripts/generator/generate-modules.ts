import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import {
  synGetBalance,
  synInitialize,
  synTransferCreateTo,
  synTransferFrom,
} from "./synthetic-parts";
import {
  colGetBalance,
  colInitialize,
  colTransferFrom,
  colTransferTo,
} from "./collateral-parts";

export const getTemplateFile = async () => {
  const templateFile = (
    await readFile(
      path.join(__dirname, "../../../pact/hyp-erc20-template.pact")
    )
  ).toString();
  return templateFile;
};

async function main() {
  const colPath = path.join(
    __dirname,
    "../../../pact/hyp-erc20-collateral/hyp-erc20-collateral.pact"
  );

  const synPath = path.join(
    __dirname,
    "../../../pact/hyp-erc20/hyp-erc20.pact"
  );
  const synName = "hyp-erc20";
  const colName = "hyp-erc20-collateral";

  // const resultSyn = await createSynthetic(await getTemplateFile(), synName);
  // await writeFile(synPath, resultSyn);

  const resultCol = await createCollateral(await getTemplateFile(), colName);
  await writeFile(colPath, resultCol);
}

export const createSynthetic = async (file: string, moduleName: string) => {
  const nameRegExp = new RegExp("<name>", "g");
  let resultFile = file.replaceAll(nameRegExp, moduleName);

  const stateRegExp = new RegExp("<state-schema>", "g");
  const stateSchema = `syn-state`;
  resultFile = resultFile.replaceAll(stateRegExp, stateSchema);
  resultFile = resultFile.replace("<initialize>", synInitialize);
  resultFile = resultFile.replace("<transfer-to>", synTransferCreateTo);
  resultFile = resultFile.replace("<transfer-from>", synTransferFrom);
  resultFile = resultFile.replace("<get-balance>", synGetBalance);

  return resultFile;
};

export const createCollateral = async (file: string, moduleName: string) => {
  const nameRegExp = new RegExp("<name>", "g");
  let resultFile = file.replaceAll(nameRegExp, moduleName);

  const stateRegExp = new RegExp("<state-schema>", "g");
  const stateSchema = `col-state`;
  resultFile = resultFile.replaceAll(stateRegExp, stateSchema);
  resultFile = resultFile.replace("<initialize>", colInitialize);
  resultFile = resultFile.replace("<transfer-to>", colTransferTo);
  resultFile = resultFile.replace("<transfer-from>", colTransferFrom);
  resultFile = resultFile.replace("<get-balance>", colGetBalance);

  return resultFile;
};

main();
