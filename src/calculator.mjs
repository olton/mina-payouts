import {getBlocks, getLagerHash, getLatestHeight, getStakingLager} from "./graphql.mjs";
import {print, exit} from "./utils.mjs";
import assert from "assert";

export const calculate = async (
    publicKey,
    {
        epoch = 0,
        fee = 0.05,
        confirmations = 15,
        minHeight = 0,
        coinbaseDefault = 720000000000
    },
    foundationDelegations = []) => {

    let ledgerHash, latestBlock, latestBlockHeightValue, maxHeight

    try {
        let ledgerHashData = await getLagerHash({epoch})

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
    print(`This script will payout from blocks ${minHeight} to ${maxHeight} in epoch ${epoch}`)

    let totalStakingBalance = 0
    let totalStakingBalanceFoundation = 0
    let payouts = []
    let allBlocksTotalRewards = 0
    let allBlocksTotalFees = 0
    let allBlocksFoundationPayouts = 0
    let allBlocksPayouts = 0
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

    let blocks

    try {
        blocks = await getBlocks({
            "creator": publicKey,
            epoch,
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
            continue
        }

        let foundationPayouts = 0
        let otherPayouts = 0
        let sumEffectivePoolStakes = 0
        let effectivePoolStakes = {}
        let coinbaseReceiver = block.transactions.coinbaseReceiverAccount.publicKey
        let coinbase = +block.transactions.coinbase ?? coinbaseDefault

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
        }

        allBlocksFoundationPayouts += foundationPayouts
        allBlocksPayouts += otherPayouts

        // Final check
        // These are essentially the same but we allow for a tiny bit of nanomina rounding and worst case we never pay more
        assert (foundationPayouts + otherPayouts + totalFees <= totalRewards)
    }

    return {
        blocks: blocksTable,
        totalRewards: allBlocksTotalRewards,
        totalFees: allBlocksTotalFees,
        totalStakingBalance,
        totalStakingFoundation: totalStakingBalanceFoundation,
        foundationPayouts: allBlocksFoundationPayouts,
        regularPayouts: allBlocksPayouts,
        payouts
    }
}