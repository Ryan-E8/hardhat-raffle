const { developmentChains } = require("../helper-hardhat-config")
const { ethers, getNamedAccounts } = require("hardhat")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium. It costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9 // 1000000000 // link per gas. Calculated value based on the gas price of the chain, this is because the chainlink nodes are the ones that pay the gas fee when calling our functions/returing values. This cost is offset by the oracle gas we pay them

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed!")
        log("-----------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
