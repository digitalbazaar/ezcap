# ezcap

[![Node.js CI](https://github.com/digitalbazaar/ezcap/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/ezcap/actions?query=workflow%3A%22Node.js+CI%22)

> An easy to use, opinionated Authorization Capabilities (zcap) client library
> for the browser and Node.js.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

This library provides a client that browser and node.js applications can use to
interact with HTTP servers protected by zcap-based authorization. The library
is configured with secure and sensible defaults to help developers get started
quickly and ensure that their client code is production-ready.

## Security

The security characteristics of this library are largely influenced by design
that implementers make with respect to private key management. The security
characteristics of the server that you communicate with using this library
are largely dependent on how carefully the server manages zcap registrations,
zcap delegations, and zcap checking. Bugs or failures related to key management,
or enforcement of zcaps will lead to security failures. It is imperative that
implementers audit their implementations, preferably by parties other than
the implementer.

## Install

- Node.js 12+ is required.

To install locally (for development):

```
git clone https://github.com/digitalbazaar/ezcap.git
cd ezcap
npm install
```

## Usage

* [Creating a Client](#creating-a-client)
* [Reading with a Root Capability](#reading-with-a-root-capability)
* [Writing with a Root Capability](#writing-with-a-root-capability)
* [Delegating a Capability](#delegating-a-capability)
* [Reading with a Delegated Capability](#reading-with-a-delegated-capability)
* [Writing with a Delegated Capability](#writing-with-a-delegated-capability)
* [Invoking with a Root Capability](#invoking-a-capability)
* [Invoking with a Delegated Capability](#invoking-a-capability)

### Creating a Client

```js
import {ZcapClient} from 'ezcap';
import didKey from 'did-method-key';
const didKeyDriver = didKey.driver();

// the base URL for the zcap client to operate against
const baseUrl = 'https://zcap.example';

// generate a DID Document and set of key pairs
const {didDocument, keyPairs} = await didKeyDriver.generate();

// create a new zcap client using the generated cryptographic material
const zcapClient = new ZcapClient({baseUrl, didDocument, keyPairs});
```

### Reading with a Root Capability

```js
const url = '/my-account/items';

// reading a URL using a zcap will result in an HTTP Response
const response = await zcapClient.read({url});

// retrieve the JSON data
const items = await response.json();
```

### Writing with a Root Capability

```js
const url = '/my-account/items';
const item = {label: 'Widget'};

// writing a URL using a zcap will result in an HTTP Response
const response = await zcapClient.write({url, json: item});

// process the response appropriately
const writtenItem = await response.json();
```

### Delegating a Capability

```js
const capability = 'https://zcap.example/foo';
const targetDelegate =
  'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const allowedActions = ['read'];
const delegatedCapability = zcapClient.delegate({capability, targetDelegate, allowedActions});
```

### Reading with a Delegated Capability

```js
const url = '/my-account/items/123';
const capability = await getCapabilityFromDatabase({url}); // defined by your code

// reading a URL using a zcap will result in an HTTP Response
const response = await zcapClient.read({url, capability});

// retrieve the JSON data
const items = await response.json();
```

### Writing with a Delegated Capability

```js
const url = '/my-account/items';
const item = {label: 'Widget'};
const capability = await getCapabilityFromDatabase({url}); // defined by your code

// writing a URL using a zcap will result in an HTTP Response
const response = await zcapClient.write({url, capability, json: item});

// process the response appropriately
const writtenItem = await response.json();
```

### Invoking with a Root Capability

```js
const url = '/my-account/items';
const item = {count: 12};

// invoking a capability against a URL will result in an HTTP Response
const response = await zcapClient.invoke({url, method: 'patch', json: item});

// process the response appropriately
const updatedItem = await response.json();
```

### Invoking with a Delegated Capability

```js
const url = '/my-account/items/123';
const item = {count: 12};
const capability = await getCapabilityFromDatabase({url}); // defined by your code

// invoking a capability against a URL will result in an HTTP Response
const response = await zcapClient.request({url, capability, method: 'patch', json: item});

// process the response appropriately
const updatedItem = await response.json();
```

## API Reference

## Typedefs

<dl>
<dt><a href="#HttpsAgent">HttpsAgent</a> : <code>object</code></dt>
<dd><p>An object that manages connection persistence and reuse for HTTPS requests.</p>
</dd>
<dt><a href="#ZcapClient">ZcapClient</a> ⇒ <code><a href="#ZcapClient">ZcapClient</a></code></dt>
<dd><p>Creates a new ZcapClient instance that can be used to perform
Authorization Capability (ZCAP) requests against HTTP URLs.</p>
</dd>
</dl>

<a name="HttpsAgent"></a>

## HttpsAgent : <code>object</code>
An object that manages connection persistence and reuse for HTTPS requests.

**Kind**: global typedef  
**See**: https://nodejs.org/api/https.html#https_class_https_agent  
<a name="ZcapClient"></a>

## ZcapClient ⇒ [<code>ZcapClient</code>](#ZcapClient)
Creates a new ZcapClient instance that can be used to perform
Authorization Capability (ZCAP) requests against HTTP URLs.

**Kind**: global typedef  
**Returns**: [<code>ZcapClient</code>](#ZcapClient) - - The new ZcapClient instance.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| options.baseUrl | <code>string</code> | The base URL for the client to use   when building invocation request URLs. |
| [options.didDocument] | <code>object</code> | A DID Document that contains   the `capabilityInvocation` and `capabilityDelegation` verification   relationships. `didDocument` and `keyPairs`, or `invocationSigner` and   `delegationSigner` must be provided. |
| [options.keyPairs] | <code>Map</code> | A map of key pairs associated with   `didDocument` indexed by key pair. `didDocument` and `keyPairs`, or   `invocationSigner` and `delegationSigner` must be provided. |
| [options.defaultHeaders] | <code>object</code> | The optional default HTTP   headers to include in every invocation request. |
| [options.agent] | [<code>HttpsAgent</code>](#HttpsAgent) | An optional HttpsAgent to use to   when performing HTTPS requests. |
| [options.invocationSigner] | <code>object</code> | An object with a   `.sign()` function and `id` and `controller` properties that will be   used for signing requests. `invocationSigner` and `delegationSigner`, or   `didDocument` and `keyPairs` must be provided. |
| [options.delegationSigner] | <code>object</code> | An object with a   `.sign()` function and `id` and `controller` properties that will be   used for signing requests. `invocationSigner` and `delegationSigner`, or   `didDocument` and `keyPairs` must be provided. |


* [ZcapClient](#ZcapClient) ⇒ [<code>ZcapClient</code>](#ZcapClient)
    * [.delegate(options)](#ZcapClient+delegate) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.request(options)](#ZcapClient+request) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.read(options)](#ZcapClient+read) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.write(options)](#ZcapClient+write) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="ZcapClient+delegate"></a>

### zcapClient.delegate(options) ⇒ <code>Promise.&lt;object&gt;</code>
Delegates an Authorization Capability to a target delegate.

**Kind**: instance method of [<code>ZcapClient</code>](#ZcapClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - A promise that resolves to a delegated
  capability.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| [options.url] | <code>string</code> | The relative URL to invoke the   Authorization Capability against, aka the `invocationTarget`. Either  `url` or `capability` must be specified. |
| [options.capability] | <code>string</code> | The parent capability to delegate.   Either `url` or `capability` must be specified. |
| options.targetDelegate | <code>string</code> | The URL identifying the entity to   delegate to. |
| [options.expires] | <code>string</code> | Optional expiration value for the   delegation. Default is 5 minutes after `Date.now()`. |
| [options.allowedActions] | <code>string</code> \| <code>Array</code> | Optional list of allowed   actions or string specifying allowed delegated action. Default: [] -   delegate all actions. |

<a name="ZcapClient+request"></a>

### zcapClient.request(options) ⇒ <code>Promise.&lt;object&gt;</code>
Performs an HTTP request given an Authorization Capability and
a target URL.

**Kind**: instance method of [<code>ZcapClient</code>](#ZcapClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - A promise that resolves to an HTTP response.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| options.url | <code>string</code> | The relative URL to invoke the   Authorization Capability against. |
| [options.capability] | <code>string</code> | The capability to invoke at the   given URL. Default: generate root capability from options.url. |
| [options.method] | <code>string</code> | The HTTP method to use when accessing   the resource. Default: 'get'. |
| [options.action] | <code>string</code> | The capability action that is being   invoked. Default: 'read'. |
| [options.headers] | <code>object</code> | The additional headers to sign and   send along with the HTTP request. Default: {}. |
| options.json | <code>object</code> | The JSON object, if any, to send with the   request. |

<a name="ZcapClient+read"></a>

### zcapClient.read(options) ⇒ <code>Promise.&lt;object&gt;</code>
Convenience function that invokes an Authorization Capability against a
given URL to perform a read operation.

**Kind**: instance method of [<code>ZcapClient</code>](#ZcapClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - A promise that resolves to an HTTP response.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| options.url | <code>string</code> | The relative URL to invoke the   Authorization Capability against. |
| options.headers | <code>object</code> | The additional headers to sign and   send along with the HTTP request. |
| [options.capability] | <code>string</code> | The capability to invoke at the   given URL. Default: generate root capability from options.url. |

<a name="ZcapClient+write"></a>

### zcapClient.write(options) ⇒ <code>Promise.&lt;object&gt;</code>
Convenience function that invokes an Authorization Capability against a
given URL to perform a write operation.

**Kind**: instance method of [<code>ZcapClient</code>](#ZcapClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - A promise that resolves to an HTTP response.  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| options.url | <code>string</code> | The relative URL to invoke the   Authorization Capability against. |
| options.json | <code>object</code> | The JSON object, if any, to send with the   request. |
| [options.headers] | <code>object</code> | The additional headers to sign and   send along with the HTTP request. |
| [options.capability] | <code>string</code> | The capability to invoke at the   given URL. Default: generate root capability from options.url. |


## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)! PRs accepted.

If editing the README.md, please follow the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar
