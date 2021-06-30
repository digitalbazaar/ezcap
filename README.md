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
decisions made by client and server software. For clients, implementers should
pay particular attention to secure private key management. For servers, security
characteristics are largely dependent on how carefully the server manages zcap
registrations, zcap invocations, and zcap delegations. Bugs or failures related
to client key management, or server zcap validity checking will lead to security
failures. It is imperative that implementers audit their implementations,
preferably via parties other than the implementer.

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
* [Requesting with a Root Capability](#requesting-with-a-root-capability)
* [Requesting with a Delegated Capability](#requesting-with-a-delegated-capability)

### Creating a Client

Creating a zcap client involves generating cryptographic key material and then
using that key material to instantiate a client designed to operate on a
specific base URL.

```js
import {ZcapClient} from 'ezcap';
import * as didKey from '@digitalbazaar/did-method-key';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
const didKeyDriver = didKey.driver();

// generate a DID Document and set of key pairs
const {didDocument, keyPairs} = await didKeyDriver.generate();

// create a new zcap client using the generated cryptographic material
const zcapClient = new ZcapClient({
  didDocument, keyPairs, suiteClass: Ed25519Signature2020
});
```

### Reading with a Root Capability

Reading data from a URL using a capability is performed in a way that is
very similar to using a regular HTTP client to perform an HTTP GET. Using
a root capability means that your client has been directly authorized to access
the URL, usually because it created the resource that is being accessed.
The term "root" means that your client is the "root of authority".

```js
const url = 'https://zcap.example/my-account/items';

// reading a URL using a zcap will result in an HTTP Response
const response = await zcapClient.read({url});

// retrieve the JSON data
const items = await response.json();
```

### Writing with a Root Capability

Writing data to URL using a capability is performed in a way that is
very similar to using a regular HTTP client to perform an HTTP POST. Using
a root capability means that your client has been directly authorized to
modify the resource at the URL, usually because it created the resource that is
being written to. The term "root" means that your client is the "root of
authority". In the example below, the server most likely registered the
client as being the root authority for the `/my-account` path on the server.

```js
const url = 'https://zcap.example/my-account/items';
const item = {label: 'Widget'};

// writing a URL using a zcap will result in an HTTP Response
const response = await zcapClient.write({url, json: item});

// process the response appropriately
const writtenItem = await response.json();
```

### Delegating a Capability

Delegating a capability consists of the client authorizing another entity to
use the capability. The example below uses a DID as the target for the
delegation. The returned `delegatedCapability` would need to be transmitted
to the entity identified by the delegation target so that they can use it
to access the resource.

```js
const capability = 'https://zcap.example/my-account/items';
const targetDelegate =
  'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const allowedActions = ['read'];
const delegatedCapability = zcapClient.delegate({capability, targetDelegate, allowedActions});
```

### Reading with a Delegated Capability

Reading with a delegated capability is similar to reading with a root
capability. The only difference is that the delegated capability needs to be
retrieved from somewhere using application-specific code and then passed
to the `read` method.

```js
const url = 'https://zcap.example/my-account/items/123';
// defined by your code
const capability = await getCapabilityFromDatabase({url, /* other */});

// reading a URL using a zcap will result in an HTTP Response; the
// `invocationTarget` from the capability provides the URL if one is not
// specified; if a URL is specified, the capability's invocation target
// MUST be a RESTful prefix of or equivalent to the URL
const response = await zcapClient.read({capability});

// retrieve the JSON data
const items = await response.json();
```

### Writing with a Delegated Capability

Writing with a delegated capability is similar to writing with a root
capability. The only difference is that the delegated capability needs to be
retrieved from somewhere using application-specific code and then passed
to the `write` method.


```js
const item = {label: 'Widget'};
const url = 'https://zcap.example/my-account/items';
// defined by your code
const capability = await getCapabilityFromDatabase({url, /* other */});

// writing a URL using a zcap will result in an HTTP Response; the
// `invocationTarget` from the capability provides the URL if one is not
// specified; if a URL is specified, the capability's invocation target
// MUST be a RESTful prefix of or equivalent to the URL
const response = await zcapClient.write({capability, json: item});

// process the response appropriately
const writtenItem = await response.json();
```

### Requesting with a Root Capability

In the event that the server API does not operate using HTTP GET and HTTP POST,
it is possible to create a zcap client request that uses other HTTP verbs. This
is done by specifying the HTTP `method` to use.

```js
const url = 'https://zcap.example/my-account/items';
const item = {count: 12};

// send a request to a URL by invoking a capability
const response = await zcapClient.request({url, method: 'patch', json: item});

// process the response appropriately
const updatedItem = await response.json();
```

### Requesting with a Delegated Capability

Performing an HTTP request with a delegated capability is similar to
doing the same with a root capability. The only difference is that the
delegated capability needs to be retrieved from somewhere using application-specific code and then passed to the `request` method.

```js
const item = {count: 12};
const url = 'https://zcap.example/my-account/items/123';
// defined by your code
const capability = await getCapabilityFromDatabase({url, /* other */});

// invoking a capability against a URL will result in an HTTP Response; the
// `invocationTarget` from the capability provides the URL if one is not
// specified; if a URL is specified, the capability's invocation target
// MUST be a RESTful prefix of or equivalent to the URL
const response = await zcapClient.request(
  {capability, method: 'patch', json: item});

// process the response appropriately
const updatedItem = await response.json();
```

## API Reference

The ezcap approach is opinionated in order to make using zcaps a pleasant
experience for developers. To do this, it makes two fundamental assumptions
regarding the systems it interacts with:

* The systems are HTTP-based and REST-ful in nature.
* The REST-ful systems center around reading and writing resources.

If these assumptions do not apply to your system, the
[zcapld](https://github.com/digitalbazaar/zcapld) library might
be a better, albeit more complex, solution for you.

Looking at each of these core assumptions more closely will help explain how designing systems to these constraints make it much easier to think about
zcaps. Let's take a look at the first assumption:

> The systems are HTTP-based and REST-ful in nature.

Many modern systems tend to have HTTP-based interfaces that are REST-ful in
nature. That typically means that most resource URLs are organized by namespaces, collections, and items:
`/<root-namespace>/<collection-id>/<item-id>`. In practice,
this tends to manifest itself as URLs that look like
`/my-account/things/1`. The ezcap approach maps the authorization model
in a 1-to-1 way to the URL. Following along with the example, the root
capability would then be `/my-account`, which you will typically create and
have access to. You can then take that root capability and delegate access
to things like `/my-account/things` to let entities you trust modify the
`things` collection. You can also choose to be more specific and only
delegate to `/my-account/things/1` to really lock down access. ezcap attempts
to keep things very simple by mapping URL hierarchy to authorization scope.

Now, let's examine the second assumption that makes things easier:

> The REST-ful systems center around reading and writing resources.

There is an incredible amount of flexibility that zcaps provide. You can
define a variety of actions: read, write, bounce, atomicSwap, start, etc.
However, all that flexibility adds complexity and one of the goals of ezcap
is to reduce complexity to the point where the solution is good enough for
80% of the use cases. A large amount of REST-ful interactions tend to
revolve around reading and writing collections and the items in those
collections. For this reason, there are only two actions that are exposed
by default in ezcap: read and write. Keeping the number of actions to a
bare minimum has allowed implementers to achieve very complex use cases with
very simple code.

These are the two assumptions that ezcap makes and with those two assumptions,
80% of all use cases we've encountered are covered.

## Functions

<dl>
<dt><a href="#getCapabilitySigners">getCapabilitySigners(options)</a> ⇒ <code>object</code></dt>
<dd><p>Retrieves the first set of capability invocation and delegation signers
associated with the <code>didDocument</code> from the <code>keyPairs</code>.</p>
</dd>
<dt><a href="#generateZcapUri">generateZcapUri(options)</a> ⇒ <code>string</code></dt>
<dd><p>Generate a zcap URI given a root capability URL or a delegated flag.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#HttpsAgent">HttpsAgent</a> : <code>object</code></dt>
<dd><p>An object that manages connection persistence and reuse for HTTPS requests.</p>
</dd>
<dt><a href="#LinkedDataSignatureSuiteClass">LinkedDataSignatureSuiteClass</a> : <code>object</code></dt>
<dd><p>An class that can be instantiated to create a suite capable of generating a
Linked Data Signature. Its constructor must receive a <code>signer</code> instance
that includes <code>.sign()</code> function and <code>id</code> and <code>controller</code> properties.</p>
</dd>
<dt><a href="#ZcapClient">ZcapClient</a> ⇒ <code><a href="#ZcapClient">ZcapClient</a></code></dt>
<dd><p>Creates a new ZcapClient instance that can be used to perform
requests against HTTP URLs that are authorized via
Authorization Capabilities (ZCAPs).</p>
</dd>
</dl>

<a name="getCapabilitySigners"></a>

## getCapabilitySigners(options) ⇒ <code>object</code>
Retrieves the first set of capability invocation and delegation signers
associated with the `didDocument` from the `keyPairs`.

**Kind**: global function
**Returns**: <code>object</code> - - A valid `invocationSigner` and `delegationSigner`
  associated with the didDocument.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| options.didDocument | <code>string</code> | A DID Document containing   verification relationships for capability invocation and delegation. |
| options.keyPairs | <code>string</code> | A map containing keypairs indexed by   key ID. |

<a name="generateZcapUri"></a>

## generateZcapUri(options) ⇒ <code>string</code>
Generate a zcap URI given a root capability URL or a delegated flag.

**Kind**: global function
**Returns**: <code>string</code> - - A zcap URI.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| [options.url] | <code>string</code> | Optional URL identifying the root capability. |

<a name="HttpsAgent"></a>

## HttpsAgent : <code>object</code>
An object that manages connection persistence and reuse for HTTPS requests.

**Kind**: global typedef
**See**: https://nodejs.org/api/https.html#https_class_https_agent
<a name="LinkedDataSignatureSuiteClass"></a>

## LinkedDataSignatureSuiteClass : <code>object</code>
An class that can be instantiated to create a suite capable of generating a
Linked Data Signature. Its constructor must receive a `signer` instance
that includes `.sign()` function and `id` and `controller` properties.

**Kind**: global typedef
<a name="ZcapClient"></a>

## ZcapClient ⇒ [<code>ZcapClient</code>](#ZcapClient)
Creates a new ZcapClient instance that can be used to perform
requests against HTTP URLs that are authorized via
Authorization Capabilities (ZCAPs).

**Kind**: global typedef
**Returns**: [<code>ZcapClient</code>](#ZcapClient) - - The new ZcapClient instance.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | The options to use. |
| [options.didDocument] | <code>object</code> | A DID Document that contains   `capabilityInvocation` and `capabilityDelegation` verification   relationships; `didDocument` and `keyPairs`, or `invocationSigner` and   `delegationSigner` must be provided in order to invoke or delegate   zcaps, respectively. |
| [options.keyPairs] | <code>Map</code> | A map of key pairs associated with   `didDocument` indexed by key pair; `didDocument` and `keyPairs`, or   `invocationSigner` and `delegationSigner` must be provided in order to    invoke or delegate zcaps, respectively. |
| [options.defaultHeaders] | <code>object</code> | The optional default HTTP   headers to include in every invocation request. |
| [options.agent] | [<code>HttpsAgent</code>](#HttpsAgent) | An optional HttpsAgent to use to   when performing HTTPS requests. |
| [options.invocationSigner] | <code>object</code> | An object with a   `.sign()` function and `id` and `controller` properties that will be   used for signing requests; `invocationSigner` or `didDocument` and   `keyPairs` must be provided to invoke zcaps. |
| [options.delegationSigner] | <code>object</code> | An object with a   `.sign()` function and `id` and `controller` properties that will be   used for delegating zcaps; `delegationSigner` or `didDocument` and   `keyPairs` must be provided to delegate zcaps. |
| options.SuiteClass | [<code>LinkedDataSignatureSuiteClass</code>](#LinkedDataSignatureSuiteClass) | The LD   signature suite class to use to sign requests and delegations. |
| [options.documentLoader] | <code>function</code> | Optional document loader   to load suite-related contexts. If none is provided, one will be   auto-generated if the suite class expresses its required context. |


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
| [options.url] | <code>string</code> | The URL to invoke the   Authorization Capability against, aka the `invocationTarget`. Either  `url` or `capability` must be specified. |
| [options.capability] | <code>string</code> | The parent capability to delegate.   Either `url` or `capability` must be specified. |
| options.targetDelegate | <code>string</code> | The URL identifying the entity to   delegate to. |
| [options.invocationTarget] | <code>string</code> | Optional invocation target   to use when narrowing a `capability`'s existing invocationTarget.   Default is to use `url`. |
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
| options.url | <code>string</code> | The URL to invoke the   Authorization Capability against. |
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
| options.url | <code>string</code> | The URL to invoke the   Authorization Capability against. |
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
| options.url | <code>string</code> | The URL to invoke the   Authorization Capability against. |
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
