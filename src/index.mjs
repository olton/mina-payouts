import {exit, print} from "./utils.mjs"
import {Table} from "console-table-printer"
import {calculate} from "./calculator.mjs"
import {getArguments} from "./arguments.mjs"

const args = getArguments()

if (!args.key) {
    exit(`Public key required!`)
}

print(`We calculate payout for key: ${args.key}`)
print(`In epoch ${args.epoch ?? 0} with fee ${(args.fee ?? 0.05) * 100}%`)

let calculations = await calculate(
    args.key,
    {
        fee: args.fee,
        epoch: args.epoch,
        confirmations: args.conf,
        minHeight: args.min,
        coinbaseDefault: args.base
    }
)

print(`The pool total staking balance is: ${calculations.totalStakingBalance}`)
print(`The foundation delegation balance is: ${calculations.totalStakingFoundation}`)
print(`There are ${calculations.payouts.length} delegates in the pool`)

print(`\nWe won these ${calculations.blocks.length} blocks:`)
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

_tableBlocks.addRows(calculations.blocks)
_tableBlocks.printTable()

print(`\nWe are paying out ${calculations.totalRewards} nanomina in this window.`)
print(`That is ${calculations.totalRewards / 10**9} mina`)
print(`Our fee is ${calculations.totalFees / 10**9} mina`)

print(`\nPayout table:`)

let payoutTable = []
let payoutJson = []
let index = 1
for (let p of calculations.payouts) {
    payoutTable.push({
        index,
        publicKey: p.publicKey,
        stack: p.stakingBalance,
        totalMina: p.total / 10**9,
        total: p.total,
        foundation: p.foundationDelegation
    })

    payoutJson.push({
        index,
        publicKey: p.publicKey,
        totalMina: p.total / 10**9,
        total: p.total,
    })

    index++
}

const _tablePayout = new Table({
    columns: [
        {name: "index", title: "ID", alignment: 'center'},
        {name: "publicKey", title: "Key", alignment: 'left'},
        {name: "stack", title: "Stack"},
        {name: "totalMina", title: "Mina"},
        {name: "total", title: "Nanomina"},
        {name: "foundation", title: "Foundation", alignment: 'center'}
    ]
})

_tablePayout.addRows(payoutTable)
_tablePayout.printTable()
