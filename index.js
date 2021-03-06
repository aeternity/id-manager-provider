import ZeroClientProvider from 'web3-provider-engine/zero'
const uuidv4 = require('uuid/v4')

const METHOD_GET_ACCOUNTS = 'getAccounts'
const METHOD_SIGN_TRANSACTION = 'signTransaction'
const METHOD_SIGN_PERSONAL_MESSAGE = 'signPersonalMessage'
const METHOD_URL_CHANGED = 'urlChanged'

class IdManagerProvider {
	constructor (options = {}) {
		this.protocol = options.protocol ? options.protocol : 'https'
		this.idManagerHost = options.idManagerHost ? options.idManagerHost : 'identity.aepps.com'
		this.rpcUrl = options.rpcUrl ? options.rpcUrl : 'https://kovan.infura.io'
		if(self===top) {
			this.idManagerWindow = null
		} else {
			this.idManagerWindow = options.idManagerWindow ? options.idManagerWindow : parent
		}
		// this should only be disabled in development
		this.skipSecurity = options.skipSecurity ? options.skipSecurity : false
		this.web3 = null
		this.provider = null
		this.handlers = {}
		this.init()
	}

	init () {
		let that = this

		this.provider = new ZeroClientProvider({
			getAccounts: function (done) {
				that.postMessage(METHOD_GET_ACCOUNTS, null, function (payload) {
					return done(null, payload)
				})
			},
			signTransaction: function (tx, done) {
				that.postMessage(METHOD_SIGN_TRANSACTION, tx, function (payload) {
					return done(null, '0x' + payload)
				})
			},
			signPersonalMessage: function (msg, done) {
				that.postMessage(METHOD_SIGN_PERSONAL_MESSAGE, msg, function (payload) {
					return done(null, payload)
				})
			},
			approveTransaction: function (tx, done) {
				// auto approve
				done(null, true)
			},
			rpcUrl: this.rpcUrl
		})

		// this is for backwards compatibility purpose
		this.web3 = {
			currentProvider: this.provider
		}

		//stop polling by default
		this.stopPolling()

		// register event listener
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
		}, false);

		['load', 'popstate'].forEach(eventName =>
			window.addEventListener(eventName, () => this.sendCurrentUrl(), false));

		['pushState', 'replaceState'].forEach(methodName => {
			const originalMethod = history[methodName]
			history[methodName] = (...args) => {
				originalMethod.apply(history, args)
				this.sendCurrentUrl()
			}
		})
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

	startPolling() {
		if (this.provider) {
			this.provider.start()
		}
	}

	stopPolling() {
		if (this.provider) {
			this.provider.stop()
		}
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

	sendCurrentUrl (event) {
		this.postMessage(METHOD_URL_CHANGED, location.href)
	}
}

export default IdManagerProvider
