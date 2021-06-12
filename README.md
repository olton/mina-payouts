# Mina Payouts

This is a `JavaScript` implementation of the excellent [Gareth's Python script](https://github.com/garethtdavies/mina-payout-script).

### Using
```shell
node index.mjs -key B62qr... -epoch 1 -fee 0.05
```

### Output
```shell
\> node src\index.mjs -f 0.1 -e 5 -k B62qq6ZYPG5JsjZnGJ3pADmRn6hU6qy13EhraTSymjSgyEDwoDR9Gd6

We calculate payout for key: B62qq6ZYPG5JsjZnGJ3pADmRn6hU6qy13EhraTSymjSgyEDwoDR9Gd6
In epoch 5 with fee 10.00%
Using ledger hash jxVF5YbC3B5Rk6ibfsL97WaqojfxrgWtEqMJST9pb4X8s3kRD2T
We are using latest block number 29934
We are using max block number 29919
This script will payout from blocks 0 to 29919 in epoch 5
The pool total staking balance is: 270735.80827890005
The foundation delegation balance is: 0
There are 16 delegates in the pool

We won these 2 blocks:
┌────┬───────┬─────────────────────┬──────────────┬─────────────┬────────────┬──────────────┐
│ ID │ Block │ Super Charge Weight │     Coinbase │ Creator Fee │ Snarks Fee │ Coinbase Fee │
├────┼───────┼─────────────────────┼──────────────┼─────────────┼────────────┼──────────────┤
│ 1  │ 26423 │ 1.9998611303985556  │ 720000000000 │   100000000 │          0 │            0 │
│ 2  │ 26267 │ 1.9998042050084637  │ 720000000000 │   141000001 │          0 │            0 │
└────┴───────┴─────────────────────┴──────────────┴─────────────┴────────────┴──────────────┘

We are paying out 1440241000001 nanomina in this window.
Total rewards is 1440.241000001 mina
Pool fee is 144.02410000010002 mina

Payout table:
┌────┬─────────────────────────────────────────────────────────┬─────────────┬───────────────┬──────────────┬────────────┐
│ ID │ Key                                                     │       Stack │          Mina │     Nanomina │ Foundation │
├────┼─────────────────────────────────────────────────────────┼─────────────┼───────────────┼──────────────┼────────────┤
│ 1  │ B62qpCVgRNPxcoC5eQKDXJoHRRfcNSRjzq2YHymp6AFciH1bsRXkkf9 │       66000 │  308.33354585 │ 308333545850 │   false    │
│ 2  │ B62qrQD8tyWsVArhMe42biJifujSr3hNpw3tRVtUakuUtRiBLmczChc │   66008.899 │ 308.375119489 │ 308375119489 │   false    │
│ 3  │ B62qpwieQeKnhXA8MEhsWAZnqA6qR2X82m6WfLqgAG82M9wnVCCsDNM │     66001.3 │ 308.339619085 │ 308339619085 │   false    │
│ 4  │ B62qjzaoqL6ShpuMrpseveR2wpsBe6WfeEpc74evonStZebJg3Qu6jG │   66000.001 │  308.33355052 │ 308333550520 │   false    │
│ 5  │ B62qq6ZYPG5JsjZnGJ3pADmRn6hU6qy13EhraTSymjSgyEDwoDR9Gd6 │           0 │             0 │            0 │   false    │
│ 6  │ B62qqG5zRcjj8sSXXPvLTmvF5qsPG2rMkwpa5Lz3KpybiF4meTjLX8n │ 940.5466765 │   8.787206918 │   8787206918 │   false    │
│ 7  │ B62qqWQ1NLEPPP6j2evUrV2CdQfDipB83doTtJVGR4HvLtrCKa2zA2f │ 981.5482274 │   9.170270429 │   9170270429 │   false    │
│ 8  │ B62qmiabNh66oiBZ7H8WyWrSxW4bpasPzrPWJuTu68Qo6F8LRAkkWim │     801.998 │   7.492793871 │   7492793871 │   false    │
│ 9  │ B62qrtc5b8QaC4wTEyXxFCCT3F13sgeeHAnHSsH67qHYfEHFgfuAS9B │       0.199 │   0.001859188 │      1859188 │   false    │
│ 10 │ B62qpgLV2xuVrt58vz79NEMogTZnZmGRSrD9RtaBKBbj153Sgb2EMDA │       3.799 │   0.035492761 │     35492761 │   false    │
│ 11 │ B62qpDqowv1aNpxoWxQvUCQJbrSctBTWyKzFHYAonMB993WtK9voDvb │      75.199 │   0.702558617 │    702558617 │   false    │
│ 12 │ B62qnhPAu6sxoxiV3jadJEZzxUz3H3ZdfLss6KdJxkiei2D5hDjwJ8W │ 1009.996375 │   9.436051772 │   9436051772 │   false    │
│ 13 │ B62qqyBD6cBATkdAa29tNAEJvJfkMTzwfuWyaJz6Ya3dJ76ZixfUter │       0.105 │   0.000980978 │       980978 │   false    │
│ 14 │ B62qoWFzQ1hSxVkp38AfHrRuZnDed9qyXuZMuen5deVNLY9ebeQttmZ │     892.993 │   8.342929131 │   8342929131 │   false    │
│ 15 │ B62qjuURfaLA3oFjSyBooqC1hHQ2PKMBTrYAvhodP3z4vKCfWqXiXtJ │     928.999 │   8.679320914 │   8679320914 │   false    │
│ 16 │ B62qnZdraERndTXCtZZb9BQVJSxSJsDozPWWyS2gADiyTtXoAuuisYM │    1090.225 │  10.185600461 │  10185600461 │   false    │
└────┴─────────────────────────────────────────────────────────┴─────────────┴───────────────┴──────────────┴────────────┘
```

### Match keys to arguments:
+ `-k` publicKey
+ `-e` epoch
+ `-c` confirmations
+ `-m` minHeight
+ `-b` coinbaseDefault

### Default values:
+ `epoch` = `0`,
+ `fee` = `0.05`,
+ `confirmations` = `15`,
+ `minHeight` = `0`,
+ `coinbaseDefault` = `720000000000`

**Important!**
`coinbaseDefault` is used for calculating payout to **foundation** addresses, for **regular payouts** we use `coinbase from block`.

## How to

#### Clone repositiry to your machine
```
git clone https://github.com/olton/mina-payouts.git
```

#### Install required compoentns
```
cd mina-payouts
npm install
```

#### Run
**Use command line arguments**
```
node src/index.mjs -k B62qq6ZYPG5JsjZnGJ3pADmRn6hU6qy13EhraTSymjSgyEDwoDR9Gd6 -e 5 -f 0.05
```

**Set required parameters into `src/index.mjs` and run
```
node src/index.mjs
```
