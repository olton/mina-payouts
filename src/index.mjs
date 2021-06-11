import assert from "assert"
import {print} from "./console.mjs"
import {getBlocks, getLagerHash, getLatestHeight, getStakingLager} from "./graphql.mjs"
import {Table} from "console-table-printer"

const exit = (message, code = 0) => {
    print(message)
    process.exit(code)
}

const publicKey = "B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw"
const stakingEpoch = 5
const minHeight = 0
const confirmations = 15
const fee = 0.10 // 0.05 = 5%
const coinbaseDefault = 720000000000
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

let blockIndex = 1
for (let block of blocks.data.blocks) {

    // ???
    if (!block.transactions.coinbaseReceiverAccount) {
        print(`${block.blockHeight} didn't have a coinbase so won it but no rewards.`)
        break
    }

    let foundationPayouts = 0
    let otherPayouts = 0
    let sumEffectivePoolStakes = 0
    let effectivePoolStakes = {}
    let coinbaseReceiver = block.transactions.coinbaseReceiverAccount.publicKey
    let coinbase = +block.transactions.coinbase

    // FEE TRANSFERS

    let feeTransfers = block.transactions.feeTransfer.filter( f => f.type === 'Fee_transfer' )
    let totalFeeTransfers = feeTransfers.reduce((acc, val) => acc + +val.fee, 0)

    let feeTransfersByCoinbase = block.transactions.feeTransfer.filter( f => f.type === 'Fee_transfer_via_coinbase' )
    let totalFeeTransfersByCoinbase = feeTransfersByCoinbase.reduce((acc, val) => acc + +val.fee, 0)

    // Sum all the fee transfers to this account with type of fee_transfer - these are the tx fees
    let feeTransfersToCreator = feeTransfers.filter( f => f.recipient === coinbaseReceiver )
    let totalFeeTransfersToCreator = feeTransfersToCreator.reduce((acc, val) => acc + +val.fee, 0)

    // Sum all the fee transfers not to this account with type of fee_transfer - this is snark work for the included tx
    let feeTransfersToSnarkers = totalFeeTransfers - totalFeeTransfersToCreator

    // Determine the supercharged weighting for the block

    // New way uses fee transfers so we share the resulting profitability of the tx and take into account the coinbase snark
    let superchargedWeighting = 1 + (1 / (1 + totalFeeTransfersToCreator / (coinbase - totalFeeTransfersByCoinbase)))

    // What are the rewards for the block - this is how we used to calculate it
    // this serves as a sense check currently to check logic
    let totalRewardsPrevMethod = coinbase + +block.txFees - +block.snarkFees

    // Can also define this via fee transfers
    let totalRewards = coinbase + totalFeeTransfersToCreator - totalFeeTransfersByCoinbase

    assert(totalRewards === totalRewardsPrevMethod, `Total rewards for two methods must be equals! Prev: ${totalRewardsPrevMethod}, Total: ${totalRewards}`)

    blocksTable.push({
        index: blockIndex,
        block: block.blockHeight,
        superchargedWeighting,
        coinbase,
        totalFeeTransfersToCreator,
        feeTransfersToSnarkers,
        totalFeeTransfersByCoinbase
    })

    blockIndex++

    let totalFees = fee * totalRewards

    allBlocksTotalRewards += totalRewards
    allBlocksTotalFees += totalFees

    let superchargedContribution

    for(let p of payouts) {
        if (p.foundationDelegation) {
            // Only pay foundation a % of the normal coinbase. Round down to the nearest nanomina
            let foundationBlockTotal = Math.floor((p.stakingBalance / totalStakingBalance) * coinbaseDefault * (1 - fee))
            p.total += foundationBlockTotal
            storePayout.push({
                publicKey: p.publicKey,
                blockHeight: block.blockHeight,
                stateHash: block.stateHash,
                totalPoolStakes: totalStakingBalance,
                stakingBalance: p.stakingBalance,
                dateTime: block.dateTime,
                coinbase: coinbase,
                totalRewards: totalRewards,
                payout: foundationBlockTotal,
                epoch: stakingEpoch,
                ledgerHash: ledgerHash,
                foundation: true
            })

            // Track all the Foundation payouts
            foundationPayouts += foundationBlockTotal
        } else {
            // This was a non foundation address, so calculate this the other way
            superchargedContribution = (superchargedWeighting - 1) * p.timedWeighting + 1
            let effectiveStake = p.stakingBalance * superchargedContribution

            // This the effective percentage of the pool disregarding the Foundation element
            effectivePoolStakes[p.publicKey] = effectiveStake
            sumEffectivePoolStakes += effectiveStake
        }
    }

    // Check here the balances make sense
    assert (foundationPayouts <= totalRewards, `Foundation payouts must be less or equal to total rewards!`)
    assert (sumEffectivePoolStakes <= 2 * totalStakingBalance)

    // What are the remaining rewards we can share? This should always be higher than if we don't share.
    let blockPoolShare = totalRewards - (foundationPayouts / (1 - fee))

    for(let p of payouts) {
        if (p.foundationDelegation === true) continue

        let effectivePoolWeighting = effectivePoolStakes[p.publicKey] / sumEffectivePoolStakes

        assert(effectivePoolWeighting <= 1, `effectivePoolWeighting must be less than 1 or we have a major issue`)

        let blockTotal = Math.floor(blockPoolShare * effectivePoolWeighting * (1 - fee))

        p.total += blockTotal
        otherPayouts += blockTotal

        storePayout.push({
            publicKey: p.publicKey,
            blockHeight: block.blockHeight,
            stateHash: block.stateHash,
            totalPoolStakes: totalStakingBalance,
            effectivePoolWeighting: effectivePoolWeighting,
            effectivePoolStakes: effectivePoolStakes[p.publicKey],
            superchargedContribution: superchargedContribution,
            stakingBalance: p.stakingBalance,
            sumEffectivePoolStakes: sumEffectivePoolStakes,
            superChargedWeighting: superchargedWeighting,
            dateTime: block.dateTime,
            coinbase: coinbase,
            totalRewards: totalRewards,
            payout: blockTotal,
            epoch: stakingEpoch,
            ledgerHash: ledgerHash
        })
    }

    // Final check
    // These are essentially the same but we allow for a tiny bit of nanomina rounding and worst case we never pay more
    assert (foundationPayouts + otherPayouts + totalFees <= totalRewards)
}

print(`We won these ${blocksTable.length} blocks:`)

const _tableBlocks = new Table({
    columns: [
        {name: "index", title: "ID", alignment: 'center'},
        {name: "block", title: "Block"},
        {name: "superchargedWeighting", title: "Super Charge Weight", alignment: 'left'},
        {name: "coinbase", title: "Coinbase"},
        {name: "totalFeeTransfersToCreator", title: "Creator Fee"},
        {name: "feeTransfersToSnarkers", title: "Snarks Fee"},
        {name: "totalFeeTransfersByCoinbase", title: "Coinbase Fee"}
    ]
})

_tableBlocks.addRows(blocksTable)
_tableBlocks.printTable()

print(`We are paying out ${allBlocksTotalRewards} nanomina in this window.`)
print(`That is ${allBlocksTotalRewards / 10**9} mina`)
print(`Our fee is ${allBlocksTotalFees / 10**9} mina`)

let payoutTable = []
let payoutJson = []
let index = 1
for (let p of payouts) {
    payoutTable.push({
        index,
        publicKey: p.publicKey,
        stack: p.stakingBalance,
        total: p.total,
        totalMina: p.total / 10**9,
        foundation: p.foundationDelegation
    })

    payoutJson.push({
        index,
        publicKey: p.publicKey,
        total: p.total,
        totalMina: p.total / 10**9
    })

    index++
}

const _tablePayout = new Table({
    columns: [
        {name: "index", title: "ID", alignment: 'center'},
        {name: "publicKey", title: "Key", alignment: 'left'},
        {name: "stack", title: "Stack"},
        {name: "total", title: "Nano"},
        {name: "totalMina", title: "Mina"},
        {name: "foundation", title: "Foundation", alignment: 'center'}
    ]
})

_tablePayout.addRows(payoutTable)
_tablePayout.printTable()
