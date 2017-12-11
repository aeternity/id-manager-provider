# Æternity ID Manager provider

This basically is a dummy web3 provider which sends its requests to the ID Manager instead of handling them itself. The communication is handled with postMessage calls and callbacks. For security all Dapps using this must run under the following url scheme http(s)://<subdomain>.aepps.(com|dev)

```javascript
import IdManagerProvider from '@aeternity/id-manager-provider'
// ...
function initWeb3() {
	let web3;
	let idManager = new IdManagerProvider({
		skipSecurity: process.env.NODE_ENV === 'development'
	})
	idManager.checkIdManager().then( (idManagerPresent) => {
		if (idManagerPresent) {
			// optional if you want the provider to poll current blocks
			idManager.startPolling()
			web3 = new Web3(idManager.provider)
		} else if (typeof window.web3 !== 'undefined') { // Metamask
			web3 = new Web3(window.web3.currentProvider);
		} else {
			web3 = null;
		}

		if (web3) {
			// Ready
		} else {
			// Not Ready
		}

	})
}
```
