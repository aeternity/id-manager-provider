import ZeroClientProvider from 'web3-provider-engine/zero'
import Web3 from 'web3'
const uuidv4 = require('uuid/v4')

const METHOD_GET_ACCOUNTS = 'getAccounts'
const METHOD_SIGN_TRANSACTION = 'signTransaction'

class IdManagerProvider {
	constructor (options = {}) {
		this.protocol = options.protocol ? options.protocol : 'http'
		this.idManagerHost = options.idManagerHost ? options.idManagerHost : 'identity.aepps.com'
		this.rpcUrl = options.rpcUrl ? options.rpcUrl : 'https://kovan.infura.io'
		if(self===top) {
			this.idManagerWindow = null
		} else {
			this.idManagerWindow = options.idManagerWindow ? options.idManagerWindow : parent
		}
		//this should only be disabled in development
		this.skipSecurity = options.skipSecurity ? options.skipSecurity : false
		this.web3 = null
		this.handlers = {}
		this.init()
	}

	init () {
		let that = this
		this.web3 = new Web3(new ZeroClientProvider({
			getAccounts: function (done) {
				that.postMessage(METHOD_GET_ACCOUNTS, null, function (payload) {
					return done(null, payload)
				})
			},
			signTransaction: function (tx, done) {
				that.getGas(tx, function (tx) {
					that.postMessage(METHOD_SIGN_TRANSACTION, tx, function (payload) {
						return done(null, '0x' + payload)
					})
				})
			},
			approveTransaction: function (tx, done) {
				// auto approve
				done(null, true)
			},
			rpcUrl: this.rpcUrl
		}))

		//register event listener
		window.addEventListener('message', function (event) {
			let data = event.data
			if (!data.uuid) {
				// this message is not for us
				return
			}
			let payload = data.payload
			let handler = that.handlers[data.uuid]
			if (handler) {
				handler(payload, event)
				delete that.handlers[data.uuid]
			}
		}, false)
	}
	
	getGas (tx, callback) {
		if (tx.gas) {
			callback(tx)
		} else {
			this.web3.eth.estimateGas({
				to: tx.to,
				data: tx.data
			}, function (error, gas) {
				tx.gas = gas
				callback(tx)
			})
		}
	}

	postMessage (method, payload, callback) {
		let uuid = uuidv4()
		this.registerHandler(uuid, callback)
		// define target origin
		let targetOrigin = this.protocol + '://' + this.idManagerHost;
		if (this.skipSecurity) {
			targetOrigin = '*'
		}
		let message = {
			uuid: uuid,
			method: method,
			payload: payload
		}
		this.idManagerWindow.postMessage(message, targetOrigin)
	}

	registerHandler(uuid, handler) {
		this.handlers[uuid] = handler
	}

	checkIdManager () {
		return new Promise((resolve, reject)=>{
			let timeout = setTimeout(()=>{
				resolve(false)
			},500)
			try {
				//return this.idManagerWindow.location.host === this.idManagerHost
				this.postMessage('handShake',null, (payload, event)=>{
					console.log('event', event)
					clearTimeout(timeout)
					resolve(true)
					//return event.origin.indexOf
				})
			} catch (err) {
				clearTimeout(timeout)
				resolve(false)
			}
		})
	}
}

export default IdManagerProvider
