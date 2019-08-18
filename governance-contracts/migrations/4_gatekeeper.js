/* eslint-disable no-console */
/* globals artifacts */
const Gatekeeper = artifacts.require('Gatekeeper');
const ParameterStore = artifacts.require('ParameterStore');
const DevGatekeeper = artifacts.require('TimeTravelingGatekeeper');
const BasicToken = artifacts.require('BasicToken');


const { abiEncode } = require('../utils');

// eslint-disable-next-line func-names
module.exports = async function (deployer, networks) {
  const { gatekeeper: config, token: tokenInfo } = global.panvalaConfig;
  const { firstEpochStart } = config;

  const firstEpochTime = new Date(firstEpochStart);
  const startTime = Math.floor(firstEpochTime / 1000);
  // console.log(startTime);

  const token = tokenInfo.deploy
    ? await BasicToken.deployed()
    : await BasicToken.at(tokenInfo.address);

  const parameters = await ParameterStore.deployed();

  console.log(`Deploying Gatekeeper with ParameterStore ${parameters.address} and token ${token.address}`);

  // Enable time travel on development networks
  // eslint-disable-next-line operator-linebreak
  const GatekeeperArtifact =
    networks === 'development' || networks === 'ganache' ? DevGatekeeper : Gatekeeper;

  const gatekeeper = await deployer.deploy(
    GatekeeperArtifact,
    startTime,
    parameters.address,
    token.address,
  );
  await parameters.setInitialValue(
    'gatekeeperAddress',
    abiEncode('address', gatekeeper.address),
  );

  // save addresses in global config
  global.panvalaConfig.deployedContracts = {
    gatekeeperAddress: gatekeeper.address,
    tokenAddress: token.address,
    parameterStoreAddress: parameters.address,
  };
};
