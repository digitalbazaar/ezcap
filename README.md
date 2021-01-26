# ezcap

[![Node.js CI](https://github.com/digitalbazaar/ezcap/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/ezcap/actions?query=workflow%3A%22Node.js+CI%22)

> An easy to use, opinionated Authorization Capabilities (zcap) client library
> for the browser and Node.js.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
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
import {ZcapClient, getCapabilitySigners} from 'ezcap';
import didKey from 'did-method-key';
const didKeyDriver = didKey.driver();

// the base URL for the zcap client to operate against
const baseUrl = 'https://zcap.example';

// generate a DID Document and set of key pairs
const {didDocument, keyPairs} = await didKeyDriver.generate();

// extract the capability invocation and delegation signers
const {invocationSigner, delegationSigner} = getCapabilitySigners({
  didDocument, keyPairs});

// create a new zcap client using the generated cryptographic material
const zcapClient = new ZcapClient({baseUrl, invocationSigner, delegationSigner});
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
const delegate = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const allowedActions = ['read'];
const delegatedCapability = zcapClient.delegate({capability, delegate, allowedActions});
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
const response = await zcapClient.invoke({url, capability, method: 'patch', json: item});

// process the response appropriately
const updatedItem = await response.json();
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)! PRs accepted.

If editing the README.md, please follow the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar
