class BaseTransport {
	constructor (options) {
		console.log('BaseTransport constructor')
	}

	getAccounts () {
		throw new Error('Not Implemented')
	}

	signTransaction (tx) {
		throw new Error('Not Implemented')
	}

	signPersonalMessage (msg) {
		throw new Error('Not Implemented')
	}

	storeMetadata (metadata) {
		throw new Error('Not Implemented')
	}

	readMetadata (metadata) {
		throw new Error('Not Implemented')
	}

	requestPermissions (permissions) {
		throw new Error('Not Implemented')
	}
}

export default BaseTransport
