# ezcap (@digitalbazaar/ezcap-client)

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
* [Invoking a Capability](#invoking-a-capability)
* [Delegating a Capability](#delegating-a-capability)

### Creating a Client

```js
import {Ed25519KeyPair} from 'crypto-ld';
import {EzcapClient} from 'ezcap-client';
import didKey from 'did-method-key';
const {keyToDidDoc} = didKey.driver();

// generate a did:key to use with the ezcap client
const keypair = await Ed25519KeyPair.generate();
const {id} = await keyToDidDoc(keypair);

const ezcap = new EzcapClient({id, keypair});
```

### Invoking a Capability

```js
const method = 'POST';
const capability = 'https://zcap.example/foo';
const payload = {foo: 'bar'};
const response = await ezcap.invoke({method, capability, payload});
```

### Delegating a Capability

```js
const capability = 'https://zcap.example/foo';
const delegate = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const actions = ['read'];
const delegatedCapability = ezcap.delegate({capability, delegate, actions});
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar
