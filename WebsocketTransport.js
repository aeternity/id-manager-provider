import BaseTransport from './BaseTransport'
import io from 'socket.io-client'

class WebsocketTransport extends BaseTransport {
	constructor (options) {
		super(options)
		console.log('WebsocketTransport constructor')
		this.messagingServer = options.messagingServer ? options.messagingServer : 'http://192.168.111.42:3000'
		this.socket = io(this.messagingServer)

		this.channel = null
		this.channelPassword = null
		this.providerConnected = false

		this.socket.on('providerConnected', (isConnected) => {
			console.log('providerConnected', isConnected)
			this.providerConnected = isConnected
		})

		this.socket.on('partnerDisconnected', () => {
			console.log('partnerDisconnected')
		})

		this.openChannel()
	}

	openChannel () {
		if (this.socket) {
			this.socket.emit('openChannel', (password) => {
				console.log('openChannelResponse', password)
				this.channelPassword = password
				alert(password)
			})
		}
	}

	async getAccounts () {
		return new Promise((resolve, reject) => {
			if (!this.providerConnected) {
				return reject(new Error('provider not connected'))
			}
			this.socket.emit('getAccounts', (accounts) => {
				return resolve(accounts)
			})
		})
	}

	async signTransaction (tx) {
		return new Promise((resolve, reject) => {
			if (!this.providerConnected) {
				return reject(new Error('provider not connected'))
			}
			this.socket.emit('signTransaction', tx, (payload) => {
				console.log('websocket signTransaction result', payload)
				return resolve(payload)
			})
		})
	}
}

export default WebsocketTransport
