import BaseTransport from './BaseTransport'
import * as METHODS from './methodConstants';
const uuidv4 = require('uuid/v4')

const DEFAULT_TIMEOUT = 500

class PostMessageTransport extends BaseTransport {
	constructor(options) {
		super(options)
		console.log('PostMessageTransport constructor')
		let that = this

		that.isConnected = true

		if(self === top) {
			this.idManagerWindow = null
		} else {
			this.idManagerWindow = options.idManagerWindow ? options.idManagerWindow : parent
		}

		this.protocol = options.protocol ? options.protocol : 'https'
		this.idManagerHost = options.idManagerHost ? options.idManagerHost : 'identity.aepps.com'
		this.skipSecurity = options.skipSecurity ? options.skipSecurity : false
		this.idManagerHost = options.idManagerHost ? options.idManagerHost : 'identity.aepps.com'
		this.handlers = {}

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

	async getAccounts () {
		return new Promise((resolve, reject) => {
			this.postMessage(METHODS.GET_ACCOUNTS, null, function (payload) {
				return resolve(payload)
			})
		})
	}

	async signTransaction (tx) {
		return new Promise((resolve, reject) => {
			this.postMessage(METHODS.SIGN_TRANSACTION, tx, function (payload) {
				return resolve(payload)
			})
		})
	}

	async signPersonalMessage (msg) {
		return new Promise((resolve, reject) => {
			this.postMessage(METHODS.SIGN_PERSONAL_MESSAGE, msg, function (payload) {
				return resolve(null, payload)
			})
		})
	}

	async storeMetadata (metadata) {
		return this.request(METHODS.STORE_METADATA, metadata, DEFAULT_TIMEOUT)
	}

	async readMetadata (metadata) {
		return this.request(METHODS.READ_METADATA, metadata, DEFAULT_TIMEOUT)
	}

	async requestPermissions (permissions) {
		return this.request(METHODS.REQUEST_PERMISSIONS, permissions, DEFAULT_TIMEOUT)
	}

	async handShake () {
		try {
			let handshakeResult = await this.request(METHODS.HANDSHAKE, null, DEFAULT_TIMEOUT)
			// console.log('handshakeResult', handshakeResult)
			return true
		} catch (e) {
			return false
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

	isConnected () {
		return this.isConnected
	}
}

export default PostMessageTransport
