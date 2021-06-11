import assert from "assert"
import {error, print} from "./console.mjs"
import {getBlocks, getLagerHash, getLatestHeight, getStakingLager} from "./graphql.mjs"

const exit = (message, code = 0) => {
    print(message)
    process.exit(code)
}

const publicKey = "B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw"
const stakingEpoch = 5
const minHeight = 0
const confirmations = 15
const coinbase = 720000000000
const coinbaseSupercharge = 1440000000000
const foundationDelegations = []
let ledgerHash, latestBlock, latestBlockHeightValue, maxHeight

try {
    let ledgerHashData = await getLagerHash({epoch: stakingEpoch})

    ledgerHash = ledgerHashData.data.blocks[0].protocolState.consensusState.stakingEpochData.ledger.hash

    print(`Using ledger hash ${ledgerHash}`)
} catch (e) {
    exit(`Can't get ledger hash because ${e.name}`)
}

if (!latestBlock) {
    latestBlock = await getLatestHeight()
} else {
    latestBlock = {'data': {'blocks': [{'blockHeight': latestBlock}]}}
}

if (!latestBlock) {
    exit(`Issue getting the latest height`)
}

latestBlockHeightValue = latestBlock.data.blocks[0].blockHeight
assert(latestBlockHeightValue > 1, "Error block height! Can't be less then 1!")

print(`We are using latest block number ${latestBlockHeightValue}`)

maxHeight = latestBlockHeightValue - confirmations

assert(maxHeight <= latestBlockHeightValue, "Error max height! Can't be more then latest block height!")

print(`We are using max block number ${maxHeight}`)
print(`This script will payout from blocks ${minHeight} to ${maxHeight} in epoch ${stakingEpoch}`)

let totalStakingBalance = 0
let totalStakingBalanceFoundation = 0
let payouts = []
let allBlocksTotalRewards = 0
let allBlocksTotalFees = 0
let storePayout = []
let blocksTable = []
let stakingLedger

try {
    stakingLedger = await getStakingLager({
        "delegate": publicKey,
        "ledgerHash": ledgerHash
    })
} catch (e) {
    exit(`Issue getting staking ledger from Explorer GraphQL`)
}

if (!stakingLedger.data.stakes || stakingLedger.data.stakes.length === 0) {
    exit(`You are haven't stakes!`)
}

for(let stake of stakingLedger.data.stakes) {
    const isFoundationStake = foundationDelegations.includes(stake.public_key)

    payouts.push({
        publicKey: stake.public_key,
        total: 0, //?
        stakingBalance: stake.balance,
        timedWeighting: !stake.timing ? 1 : stake.timing.timed_weighting,
        foundationDelegation: isFoundationStake
    })

    if (isFoundationStake) {
        totalStakingBalanceFoundation += stake.balance
    }

    totalStakingBalance += stake.balance
}

print(`The pool total staking balance is: ${totalStakingBalance}`)
print(`The foundation delegation balance is: ${totalStakingBalanceFoundation}`)

print(`There are ${payouts.length} delegates in the pool`)

let blocks

try {
    blocks = await getBlocks({
        "creator": publicKey,
        "epoch": stakingEpoch,
        "blockHeightMin": minHeight,
        "blockHeightMax": maxHeight,
    })
} catch (e) {
    exit(`Issue getting blocks from Explorer GraphQL`)
}

// print(blocks.data.blocks)

if (!blocks.data.blocks || blocks.data.blocks.length === 0) {
    exit(`Nothing to payout as we didn't win anything`)
}

for (let block of blocks.data.blocks) {

}