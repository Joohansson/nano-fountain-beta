/*!
 * IOTA Fountain
 * Copyright(c) 2019 Peter Ryszkiewicz
 * MIT Licensed
 */

import EventEmitter from 'events'
import ConnectionStatusEnum from '../ConnectionStatusEnum'

let webSocketClient = null
let tps = 0
const tpsInterval = 600 // ms
let transactionsWithinInterval = 0
const eventEmitter = new EventEmitter()

function getWebSocketURL() {
  return `wss://ws-beta.nanoticker.info`
}

function makeWebSocket() {
  return new WebSocket(getWebSocketURL())
}

function valueForBitcoinOuts(outArray) {
  return outArray.reduce((acc, cur) => { return acc + cur.value }, 0)
}

function tryWebSocketConnection() {
  console.log(`${new Date().toISOString()}: Trying to create a new transaction stream WebSocket`)

  eventEmitter.emit('state', ConnectionStatusEnum.connecting)

  webSocketClient = makeWebSocket()

  webSocketClient.addEventListener('open', () => {
    console.log(`${new Date().toISOString()}: Opened transaction stream WebSocket`)
    eventEmitter.emit('state', ConnectionStatusEnum.connected)
    webSocketClient.send(JSON.stringify({
      "action": "subscribe",
      "topic": "confirmation"
    }))
  })

  webSocketClient.addEventListener('message', message => {
    try {
      const messageObject = JSON.parse(Buffer.from(message.data).toString())
      //console.log(`${new Date().toISOString()}: got newTransaction`, messageObject)
      if(messageObject.topic !== "confirmation") { return console.log(`${new Date().toISOString()}: ignore ${messageObject.event}`) }
      if(!messageObject.message) { return console.warn(`${new Date().toISOString()}: received unserializable message; no data`) }
      if(!messageObject.message.hash) { return console.warn(`${new Date().toISOString()}: received unserializable message; no data.hash`) }
      if(!messageObject.message.amount) { return console.warn(`${new Date().toISOString()}: received unserializable message; no data.amount`) }
      const amount = parseInt(messageObject.message.amount)

      transactionCallback({
        hash: messageObject.message.hash,
        value: amount
      })
      ++transactionsWithinInterval
    } catch (e) {
      console.error('An error occurred while deserializing', e)
    }
  })

  webSocketClient.addEventListener('close', function() {
    console.warn(`${new Date().toISOString()}: The transaction stream WebSocket closed`)
    eventEmitter.emit('state', ConnectionStatusEnum.disconnected)
    if(this !== webSocketClient) { return }
    setTimeout(tryWebSocketConnection, 3000 + Math.random() * 1000)
  })

  webSocketClient.addEventListener('error', (error) => {
    console.warn(`${new Date().toISOString()}: The transaction stream WebSocket got an error: ${error}`)
    eventEmitter.emit('state', ConnectionStatusEnum.disconnecting)
  })
}

let transactionCallback = () => {}

function setTransactionCallback(callback) {
  transactionCallback = callback
}

function start() {
  stop()
  tryWebSocketConnection()
}

function stop() {
  if(!webSocketClient) { return }
  eventEmitter.emit('state', ConnectionStatusEnum.disconnecting)
  const localWebSocketClient = webSocketClient
  webSocketClient = null
  localWebSocketClient.close()
}

function getTransactionsPerSecond() {
  return tps
}

setInterval(() => {
  tps = transactionsWithinInterval / tpsInterval * 1000.0
  transactionsWithinInterval = 0
}, tpsInterval)

export default function () {
  tryWebSocketConnection()

  return {
    setTransactionCallback,
    start,
    stop,
    getTransactionsPerSecond,
    eventEmitter
  }
}
