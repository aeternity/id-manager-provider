# Æternity ID Manager provider

This basically is a dummy web3 provider which sends its requests to the ID Manager instead of handling them itself. The communication is handled with postMessage calls and callbacks. For security all Dapps using this must run under the following url scheme http(s)://<subdomain>.aepps.(com|dev)

```javascript
import IdManagerProvider from '@aeternity/id-manager-provider'
// ...
let idManager = new IdManagerProvider({
	// for development you can override the host, default is identity.aepps.com
	idManagerHost: 'identity.aepps.dev'
	// OR you can disable security checking with
	// skipSecurity: true
	// but only use this with local development, it wont work with the deployed identity manager anyway
})
// checkIdManager checks if the idManagerWindow (by default the iframes parent) has the correct host
if (idManager.checkIdManager()) {
	web3 = new Web3(idManager.web3.currentProvider)
}
```
