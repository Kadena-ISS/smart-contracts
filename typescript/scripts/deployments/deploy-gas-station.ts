
import { deployGuards } from './gas-station/smart-contracts/guards/deploy'
import { deployGasStation } from './gas-station/smart-contracts/kadena-xchain-gas/deploy'

export const deployGasStations = async () => {
  await deployGuards('0');
  await deployGasStation('0');
  await deployGuards('1');
  await deployGasStation('1');
};