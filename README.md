# ezcap

[![Node.js CI](https://github.com/digitalbazaar/ezcap/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/ezcap/actions?query=workflow%3A%22Node.js+CI%22)

> An opinionated Authorization Capabilities (ZCAP) client library for the
> browser and Node.js that is easy to use.

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
interact with HTTP servers protected by ZCAP-based authorization. The library
is configured with secure and sensible defaults to help developers get started
quickly and ensure that their client code is production-ready.

## Security

TBD

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
* [Reading](#reading)
* [Writing](#writing)
* [Invoking a Capability](#invoking-a-capability)
* [Delegating a Capability](#delegating-a-capability)

### Creating a Client

```js
import {ZcapClient, getCapabilitySigners} from 'ezcap';
import didKey from 'did-method-key';
const didKeyDriver = didKey.driver();

// the base URL for the ZCAP client to operate against
const baseUrl = 'https://zcap.example';

// generate a DID Document and set of keypairs
const {didDocument, keyPairs} = await didKeyDriver.generate();

// extract the capability invocation and delegation signers
const {invocationSigner, delegationSigner} = getCapabilitySigners({
  didDocument, keyPairs});

// create a new ZCAP client using the generated cryptographic material
const zcapClient = new ZcapClient({baseUrl, invocationSigner, delegationSigner});
```

### Reading

```js
const url = '/items';

// reading a URL using a zcap will result in an HTTP Response
const response = await zcapClient.read({url});

// retrieve the JSON data
const items = await response.json();
```

### Writing

```js
const url = '/items';
const item = {label: 'Widget'};

// writing a URL using a zcap will result in an HTTP Response
const response = await zcapClient.write({url, json: item});

// process the response appropriately
const writtenItem = await response.json();
```

### Invoking a Capability

```js
const url = '/items';
const item = {count: 12};

// invoking a capability against a URL will result in an HTTP Response
const response = await zcapClient.invoke({url, method: 'patch', json: item});

// process the response appropriately
const updatedItem = await response.json();
```

### Delegating a Capability

```js
const capability = 'https://zcap.example/foo';
const delegate = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const actions = ['read'];
const delegatedCapability = zcapClient.delegate({
  capability, delegate, actions
});
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
