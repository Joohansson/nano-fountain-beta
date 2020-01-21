import BitcoinTransactionSubscriber from './lib/TransactionSubscribers/BitcoinTransactionSubscriber'
import NanoTransactionSubscriber from './lib/TransactionSubscribers/NanoTransactionSubscriber'
import IOTATransactionSubscriber from './lib/TransactionSubscribers/IOTATransactionSubscriber'
import BananoTransactionSubscriber from './lib/TransactionSubscribers/BananoTransactionSubscriber'

const coinFlags = new Set([
  "VUE_APP_BITCOIN_FOUNTAIN",
  "VUE_APP_NANO_FOUNTAIN",
  "VUE_APP_BANANO_FOUNTAIN",
  "VUE_APP_IOTA_FOUNTAIN"
])

function getCurrentCoinKey() {
  let existingCoinFlags = new Set()

  for(let coinFlag of coinFlags) {
    if(process.env[coinFlag]) {
      existingCoinFlags.add(coinFlag)
    }
  }

  if(existingCoinFlags.size !== 1) {
    throw `Must supply exactly one of ${JSON.stringify(...coinFlags.values())}, in the environment`
  }

  return existingCoinFlags.values().next().value
}

let currentCoin = getCurrentCoinKey()

const baseHashExplorerURL = {
  VUE_APP_BITCOIN_FOUNTAIN: "https://www.blockchain.com/btc/tx/",
  VUE_APP_NANO_FOUNTAIN: "https://b.repnode.org/block/",
  VUE_APP_BANANO_FOUNTAIN: "https://creeper.banano.cc/explorer/block/",
  VUE_APP_IOTA_FOUNTAIN: "https://thetangle.org/transaction/"
}

export function getExplorerURLForHash(hash) {
  const baseURL = baseHashExplorerURL[currentCoin]
  return `${baseURL}${hash}`
}

const valueUnits = {
  VUE_APP_BITCOIN_FOUNTAIN: "satoshis",
  VUE_APP_NANO_FOUNTAIN: "raw NANO",
  VUE_APP_BANANO_FOUNTAIN: "raw BANANO",
  VUE_APP_IOTA_FOUNTAIN: "IOTA"
}

export function getValueUnits() {
  return valueUnits[currentCoin]
}

const transactionStreamInitializers = {
  VUE_APP_BITCOIN_FOUNTAIN: () => BitcoinTransactionSubscriber(),
  VUE_APP_NANO_FOUNTAIN: () => NanoTransactionSubscriber(),
  VUE_APP_BANANO_FOUNTAIN: () => BananoTransactionSubscriber(),
  VUE_APP_IOTA_FOUNTAIN: () => IOTATransactionSubscriber({
    iotaTransactionStreamIP: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_IP,
    iotaTransactionStreamPort: process.env.VUE_APP_IOTA_TRANSACTION_STREAM_PORT,
    isIotaTransactionStreamSecured: process.env.VUE_APP_IS_IOTA_TRANSACTION_STREAM_SECURED
  }),
}

export function initializeTransactionStreamSubscriber() {
  return transactionStreamInitializers[getCurrentCoinKey()]()
}

const appTitles = {
  VUE_APP_BITCOIN_FOUNTAIN: "Bitcoin Fountain",
  VUE_APP_NANO_FOUNTAIN: "NANO BETA Fountain",
  VUE_APP_BANANO_FOUNTAIN: "BANANO Fountain",
  VUE_APP_IOTA_FOUNTAIN: "IOTA Fountain"
}

export function getAppTitle() {
  return appTitles[getCurrentCoinKey()]
}
