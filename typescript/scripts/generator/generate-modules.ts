import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";

export const getCollateralFile = async () => {
  const templateFile = (
    await readFile(path.join(__dirname, "../../../pact/col-template.pact"))
  ).toString();
  return templateFile;
};
export const getSyntheticFile = async () => {
  const templateFile = (
    await readFile(path.join(__dirname, "../../../pact/syn-template.pact"))
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

  const resultSyn = await createNamedFile(await getSyntheticFile(), synName);
  await writeFile(synPath, resultSyn);

  const resultCol = await createNamedFile(await getCollateralFile(), colName);
  await writeFile(colPath, resultCol);
}

export const createNamedFile = async (file: string, moduleName: string) => {
  const nameRegExp = new RegExp("<name>", "g");
  let resultFile = file.replaceAll(nameRegExp, moduleName);
  return resultFile;
};

main();
