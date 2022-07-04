const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network, ethers, getNamedAccounts } = require("hardhat")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30") //30 is overkill, 2 would work

module.exports = async ({ getNamedAccounts, deployments }) => {
    // Pulling deploy and log functions out of deployments
    const { deploy, log } = deployments
    // Grabbing the deployer account from our Named Accounts section in our config
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        // gets most recent deployment of our VRFCoordinatorV2Mock
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        // Creating our subscription
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        // In the transactionReceipt there is an event that is emitted with our subscription that we can get
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        // We have our subscriptionId, now we need to fund it. On a real network we'd need LINK to fund it
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        // If not on development chain, grabs vrfCoordinator address based on our current network
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // If not on a local network and our etherscan api key exists then we are going to verfiy
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    }
    log("-----------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
