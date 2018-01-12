import ZeroClientProvider from 'web3-provider-engine/zero'
import WebsocketTransport from './WebsocketTransport'
import PostMessageTransport from './PostMessageTransport'
const uuidv4 = require('uuid/v4')

import * as METHODS from './methodConstants';

class IdManagerProvider {
	constructor (options = {}) {
		this.protocol = options.protocol ? options.protocol : 'https'
		this.rpcUrl = options.rpcUrl ? options.rpcUrl : 'https://kovan.infura.io'
		this.metadataVersion = options.metadataVersion || 'v0.1'
		this.web3 = null
		this.provider = null
		this.transport = null
		this.options = options
		this.usesPostMessage = false
		// this.init(options)
	}

	async init () {
		let that = this

		let postMessageTransport = new PostMessageTransport(this.options)

		// check if in a postMessage environment
		let isPostMessage = await postMessageTransport.handShake()
		if (isPostMessage) {
			this.usesPostMessage = true
			that.transport = postMessageTransport
		} else {
			that.transport = new WebsocketTransport(this.options)
		}


		this.provider = new ZeroClientProvider({
			getAccounts: function (done) {
				that.transport.getAccounts().then(accounts => {
					return done(null, accounts)
				}).catch(e => {
					console.log(e)
					return done(e)
				})
			},
			signTransaction: function (tx, done) {
				that.transport.signTransaction(tx).then(payload => {
					return done(null, '0x' + payload)
				}).catch(e => {
					return done(e)
				})
			},
			signPersonalMessage: function (msg, done) {
				that.transport.signPersonalMessage(msg).then(payload => {
					return done(null, payload)
				}).catch(e => {
					return done(e)
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

	storeMetadata (key, value, namespace = null) {
		let metadata = {
			metadataVersion: this.metadataVersion,
			key: key,
			value: value,
			namespace: namespace
		}
		return this.transport.storeMetadata(metadata)
	}

	readMetadata (key, namespace = null) {
		let metadata = {
			metadataVersion: this.metadataVersion,
			key: key,
			namespace: namespace
		}
		return this.transport.readMetadata(metadata)
	}

	requestPermissions (permissions) {
		return this.transport.requestPermissions(permissions)
	}
}

export default IdManagerProvider
