import ZeroClientProvider from 'web3-provider-engine/zero'
import Web3 from 'web3'

const METHOD_GET_ACCOUNTS = 'getAccounts'
const METHOD_GET_ACCOUNTS_RETURN = 'getAccountsReturn'
const METHOD_SIGN_TRANSACTION = 'signTransaction'
const METHOD_SIGN_TRANSACTION_RETURN = 'signTransactionReturn'

class IdManagerProvider {
	constructor (options) {
		this.idManagerHost = options.idManagerHost ? options.idManagerHost : 'identity.aepps.com'
		this.rpcUrl = options.rpcUrl ? options.rpcUrl : 'https://kovan.infura.io'
		this.idManagerWindow = options.idManagerWindow ? options.idManagerWindow : parent
		this.web3 = null
		this.init()
	}

	init () {
		let that = this
		this.web3 = new Web3(new ZeroClientProvider({
			getAccounts: function (done) {
				let receiveHandler = that.getHandler(METHOD_GET_ACCOUNTS_RETURN, function (err, payload) {
					// remove the handler after handled, yay
					window.removeEventListener('message', receiveHandler)
					if (err) {
						return done(err)
					}
					return done(null, payload)
				})
				window.addEventListener('message', receiveHandler, false)
				that.postMessage(METHOD_GET_ACCOUNTS)
			},
			signTransaction: function (tx, done) {
				let receiveHandler = that.getHandler(METHOD_SIGN_TRANSACTION_RETURN, function (err, payload) {
					console.log('receiveHandler signTransaction', err, payload)
					// remove the handler after handled, yay
					window.removeEventListener('message', receiveHandler)
					if (err) {
						return done(err)
					}
					return done(null, '0x' + payload)
				})
				window.addEventListener('message', receiveHandler, false)
				that.postMessage(METHOD_SIGN_TRANSACTION, tx)
			},
			approveTransaction: function (tx, done) {
				// auto approve
				done(null, true)
			},
			rpcUrl: this.rpcUrl
		}))
	}

	getHandler (desiredMethod, callback) {
		return function (event) {
			// console.log('receive message', event)
			// TODO: origin check
			// if (event.origin !== "http://identity.aepps.com") {
			// 	return
			// }
			let data = event.data
			if (!data.method) {
				// console.log('no method in data')
				// return callback(Error('no method in data'))
				return
			}
			let method = data.method
			let payload = data.payload
			if (method === desiredMethod) {
				return callback(null, payload)
			}
		}
	}

	postMessage (method, payload) {
		// TODO: define target origin
		// let targetOrigin = '"http://identity.aepps.com"';
		let targetOrigin = '*'
		let message = {
			method: method,
			payload: payload
		}
		this.idManagerWindow.postMessage(message, targetOrigin)
	}

	checkIdManager () {
		// console.log('checkIdManager', this.idManagerWindow.location.host, this.idManagerHost)
		return this.idManagerWindow.location.host === this.idManagerHost
	}
}

export default IdManagerProvider
