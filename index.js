import ZeroClientProvider from 'web3-provider-engine/zero'
const uuidv4 = require('uuid/v4')

const METHOD_GET_ACCOUNTS = 'getAccounts'
const METHOD_SIGN_TRANSACTION = 'signTransaction'
const METHOD_SIGN_PERSONAL_MESSAGE = 'signPersonalMessage'
const METHOD_STORE_METADATA = 'storeMetadata'
const METHOD_READ_METADATA = 'readMetadata'
const METHOD_REQUEST_PERMISSIONS = 'requestPermissions'
const METHOD_HANDSHAKE = 'handShake'

const DEFAULT_TIMEOUT = 500

class IdManagerProvider {
	constructor (options = {}) {
		this.protocol = options.protocol ? options.protocol : 'https'
		this.idManagerHost = options.idManagerHost ? options.idManagerHost : 'identity.aepps.com'
		this.rpcUrl = options.rpcUrl ? options.rpcUrl : 'https://kovan.infura.io'
		this.metadataVersion = options.metadataVersion || 'v0.1'
		if(self === top) {
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
		}, false)
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

	async checkIdManager () {
		try {
			let handshakeResult = await this.request(METHOD_HANDSHAKE, null, DEFAULT_TIMEOUT)
			// console.log('handshakeResult', handshakeResult)
			return true
		} catch (e) {
			return false
		}
	}

	storeMetadata (key, value, namespace = null) {
		let metadata = {
			metadataVersion: this.metadataVersion,
			key: key,
			value: value,
			namespace: namespace
		}
		return this.request(METHOD_STORE_METADATA, metadata, DEFAULT_TIMEOUT)
	}

	readMetadata (key, namespace = null) {
		let data = {
			metadataVersion: this.metadataVersion,
			key: key,
			namespace: namespace
		}
		return this.request(METHOD_READ_METADATA, data, DEFAULT_TIMEOUT)
	}

	requestPermissions (permissions) {
		return this.request(METHOD_REQUEST_PERMISSIONS, permissions, DEFAULT_TIMEOUT)
	}

	request (method, data, timeoutTime = 0) {
		return new Promise((resolve, reject) => {
			let timeout = null
			if (timeoutTime > 0) {
				timeout = setTimeout(() => {
					// TODO: own error class
					reject(new Error('Timeout'))
				}, timeoutTime)
			}
			try {
				this.postMessage(method, data, (payload, event) => {
					console.log('event', event)
					if (timeout) {
						clearTimeout(timeout)
					}
					resolve(payload)
				})
			} catch (err) {
				clearTimeout(timeout)
				reject(err)
			}
		})
	}
}

export default IdManagerProvider
