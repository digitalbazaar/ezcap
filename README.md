# ezcap-client

[![Node.js CI](https://github.com/digitalbazaar/ezcap-client/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/ezcap-client/actions?query=workflow%3A%22Node.js+CI%22)

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
git clone https://github.com/digitalbazaar/ezcap-client.git
cd ezcap-client
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
import {Ed25519VerificationKey2018}
  from '@digitalbazaar/ed25519-verification-key-2018';
import didKey from 'did-method-key';
const {keyToDidDoc} = didKey.driver();
import {ZcapClient} from 'ezcap-client';

// the base URL to operate against
const baseUrl = 'https://zcap.example/';

// generate the cryptographic material for the ZCAP client
const keypair = await Ed25519VerificationKey2018.generate();
const invocationSigner = keypair.signer();
const didDoc = await didKeyDriver.keyToDidDoc(keypair);
invocationSigner.id = didDoc.capabilityInvocation[0];

// create the zcap client
const zcapClient = new ZcapClient({baseUrl, invocationSigner});
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
const response = await zcapClient.invoke({
  url,
  method: 'patch',
  json: item
});

// process the response appropriately
const updatedItem = await response.json();
```

### Delegating a Capability

```js
const capability = 'https://zcap.example/foo';
const delegate = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const actions = ['read'];
const delegatedCapability = ezcap.delegate({capability, delegate, actions});
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
