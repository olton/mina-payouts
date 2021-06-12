import {exit, print} from "./utils.mjs"
import {Table} from "console-table-printer"
import {calculate} from "./calculator.mjs"
import {getArguments} from "./arguments.mjs"

/*
* Using command line argument
* node index.mjs -key B62qr... -epoch 1 -fee 0.05
*
* Match keys to arguments:
* -k === publicKey
* -e === epoch
* -c === confirmations
* -m === minHeight
* -b === coinbaseDefault
*
* Default values:
* epoch = 0,
* fee = 0.05,
* confirmations = 15,
* minHeight = 0,
* coinbaseDefault = 720000000000
*
* Important!
* coinbaseDefault is used for calculating payout to foundation addresses, for regular payouts we use coinbase from block
* */

const args = getArguments()

/*
* Set foundation delegation addresses, if exists
* */
const foundation = []

/*
* Set calculation parameters
* */
const {
    k: key = "B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw",
    f: fee = 0.05,
    e: epoch = 0,
    c: confirmations = 15,
    m: minHeight = 0,
    b: coinbase = 720000000000
} = args

print(`We calculate payout for key: ${key}`)
print(`In epoch ${epoch} with fee ${(fee * 100).toFixed(2)}%`)

/*
* Calculate payouts
* */
let calculations = await calculate(
    key,
    {
        fee,
        epoch,
        confirmations,
        minHeight,
        coinbaseDefault: coinbase
    },
    foundation
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
print(`Total rewards is ${calculations.totalRewards / 10**9} mina`)
print(`Pool fee is ${calculations.totalFees / 10**9} mina`)

print(`\nPayout table:`)

let payoutTable = []
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
