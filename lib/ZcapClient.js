/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {DEFAULT_HEADERS, httpClient} from '@digitalbazaar/http-client';
import {
  CapabilityDelegation,
  constants as zCapConstants,
  documentLoader as zcapDocumentLoader,
  extendDocumentLoader
} from '@digitalbazaar/zcap';
import {generateZcapUri, getCapabilitySigners} from './util.js';
import jsigs from 'jsonld-signatures';
import {signCapabilityInvocation} from
  '@digitalbazaar/http-signature-zcap-invoke';

const {ZCAP_CONTEXT_URL, ZCAP_ROOT_PREFIX} = zCapConstants;

/**
 * An object that manages connection persistence and reuse for HTTPS requests.
 *
 * @typedef {object} HttpsAgent
 * @see https://nodejs.org/api/https.html#https_class_https_agent
 */

/**
 * An class that can be instantiated to create a suite capable of generating a
 * Linked Data Signature. Its constructor must receive a `signer` instance
 * that includes `.sign()` function and `id` and `controller` properties.
 *
 * @typedef {object} LinkedDataSignatureSuiteClass
 */

export class ZcapClient {
  /**
   * Creates a new ZcapClient instance that can be used to perform
   * requests against HTTP URLs that are authorized via
   * Authorization Capabilities (ZCAPs).
   *
   * @typedef ZcapClient
   *
   * @param {object} options - The options to use.
   * @param {LinkedDataSignatureSuiteClass} options.SuiteClass - The LD
   *   signature suite class to use to sign requests and delegations.
   * @param {object} [options.didDocument] - A DID Document that contains
   *   `capabilityInvocation` and `capabilityDelegation` verification
   *   relationships; `didDocument` and `keyPairs`, or `invocationSigner` and
   *   `delegationSigner` must be provided in order to invoke or delegate
   *   zcaps, respectively.
   * @param {Map} [options.keyPairs] - A map of key pairs associated with
   *   `didDocument` indexed by key pair; `didDocument` and `keyPairs`, or
   *   `invocationSigner` and `delegationSigner` must be provided in order to
   *    invoke or delegate zcaps, respectively.
   * @param {object} [options.delegationSigner] - An object with a
   *   `.sign()` function and `id` and `controller` properties that will be
   *   used for delegating zcaps; `delegationSigner` or `didDocument` and
   *   `keyPairs` must be provided to delegate zcaps.
   * @param {object} [options.invocationSigner] - An object with a
   *   `.sign()` function and `id` and `controller` properties that will be
   *   used for signing requests; `invocationSigner` or `didDocument` and
   *   `keyPairs` must be provided to invoke zcaps.
   * @param {HttpsAgent} [options.agent] - An optional HttpsAgent to use to
   *   when performing HTTPS requests.
   * @param {object} [options.defaultHeaders] - The optional default HTTP
   *   headers to include in every invocation request.
   * @param {Function} [options.documentLoader] - Optional document loader
   *   to load suite-related contexts. If none is provided, one will be
   *   auto-generated if the suite class expresses its required context.
   *
   * @returns {ZcapClient} - The new ZcapClient instance.
   */
  constructor({
    SuiteClass, didDocument, keyPairs, delegationSigner, invocationSigner,
    agent, defaultHeaders = {}, documentLoader
  } = {}) {
    if(!SuiteClass) {
      throw new TypeError('"SuiteClass" must be provided.');
    }

    this.agent = agent;
    this.defaultHeaders = {...DEFAULT_HEADERS, ...defaultHeaders};
    this.SuiteClass = SuiteClass;

    // set the appropriate invocation and delegation signers
    if(didDocument && keyPairs) {
      const signers = getCapabilitySigners({didDocument, keyPairs});
      this.invocationSigner = signers.invocationSigner;
      this.delegationSigner = signers.delegationSigner;
    } else if(invocationSigner || delegationSigner) {
      this.invocationSigner = invocationSigner;
      this.delegationSigner = delegationSigner;
    } else {
      throw new TypeError(
        'Either `didDocument` and `keyPairs`, or `invocationSigner` and/or ' +
        '`delegationSigner` must be provided.');
    }

    // auto generate doc loader as needed if suite context is provided
    if(!documentLoader && SuiteClass.CONTEXT && SuiteClass.CONTEXT_URL) {
      documentLoader = extendDocumentLoader(
        async function suiteContextLoader(url) {
          if(url === SuiteClass.CONTEXT_URL) {
            return {
              contextUrl: null,
              document: SuiteClass.CONTEXT,
              documentUrl: url,
              tag: 'static'
            };
          }
          return jsigs.strictDocumentLoader(url);
        });
    }
    this.documentLoader = documentLoader || zcapDocumentLoader;
  }

  /**
   * Delegates an Authorization Capability to a target delegate.
   *
   * @param {object} options - The options to use.
   * @param {object} [options.capability] - The parent capability to
   *   delegate; must be an object if it is a delegated zcap, can be a string
   *   if it is a root zcap but then `invocationTarget` must be specified; if
   *   not specified, this will be auto-generated as a root zcap for the given
   *   `invocationTarget`.
   * @param {string} options.controller - The URL identifying the entity to
   *   delegate to, i.e., the party that will control the new zcap.
   * @param {string} [options.invocationTarget] - Optional invocation target
   *   to use when narrowing a `capability`'s existing invocationTarget.
   *   Default is to use `capability.invocationTarget`, provided that
   *   `capability` is an object.
   * @param {string|Date} [options.expires] - Optional expiration value
   *   for the delegation. Default is 5 minutes after `Date.now()`.
   * @param {string|Array} [options.allowedActions] - Optional list of allowed
   *   actions or string specifying allowed delegated action. Default: [] -
   *   delegate all actions.
   *
   * @returns {Promise<object>} - A promise that resolves to a delegated
   *   capability.
   */
  async delegate({
    capability, controller, invocationTarget, expires,
    allowedActions = []
  } = {}) {
    if(!this.delegationSigner) {
      throw new Error('"delegationSigner" was not provided in constructor.');
    }
    if(invocationTarget !== undefined &&
      !(typeof invocationTarget === 'string' &&
      invocationTarget.includes(':'))) {
      throw new Error(
        '"invocationTarget" must be a string expressing an absolute URI.');
    }

    if(!(capability || invocationTarget)) {
      throw new TypeError(
        'At least one of "capability" and "invocationTarget" is required.');
    }

    if(expires === undefined) {
      // default expiration is 5 minutes in the future
      expires = new Date(Date.now() + 5 * 60 * 1000);
    } else if(expires instanceof Date || typeof expires === 'string') {
      // ensure expires is a valid date
      const time = Date.parse(expires);
      if(isNaN(time)) {
        throw new Error('"expires" is not a valid date.');
      }
    } else {
      throw new TypeError('"expires" must be a string or a date.');
    }

    // ensure expires is a string
    if(typeof expires !== 'string') {
      // use second precision
      expires = expires.toISOString().slice(0, -5) + 'Z';
    }

    if(!capability) {
      // generate root zcap ID from `invocationTarget`
      capability = await generateZcapUri({url: invocationTarget});
    }

    let parentCapability;
    if(typeof capability === 'string') {
      parentCapability = capability;
    } else if(typeof capability === 'object' &&
      typeof capability.id === 'string') {
      parentCapability = capability.id;
    } else {
      throw new TypeError(
        '"capability" must be a string to delegate a root capability or ' +
        'a capability object to delegate a delegated capability.');
    }

    if(invocationTarget === undefined) {
      if(typeof capability === 'string') {
        throw new Error(
          '"invocationTarget" must be specified when "capability" is ' +
          'a string.');
      }
      // inherit `capability` invocation target
      invocationTarget = capability.invocationTarget;
    }

    if(typeof invocationTarget !== 'string') {
      throw new TypeError('"invocationTarget" must be a string.');
    }

    if(typeof allowedActions === 'string') {
      // convert string value for allowedActions to array
      allowedActions = (typeof allowedActions === 'string') ?
        allowedActions = [allowedActions] : allowedActions;
    }
    if(!Array.isArray(allowedActions)) {
      throw new TypeError(
        '"allowedActions" must be a string or an array of strings.');
    }

    const delegatedCapability = {
      '@context': ZCAP_CONTEXT_URL,
      id: await generateZcapUri(),
      controller,
      parentCapability,
      invocationTarget,
      expires
    };
    if(allowedActions.length > 0) {
      delegatedCapability.allowedAction = allowedActions;
    }

    const {documentLoader} = this;
    const signedDelegatedCapability = await jsigs.sign(
      delegatedCapability, {
        documentLoader,
        suite: new this.SuiteClass({signer: this.delegationSigner}),
        purpose: new CapabilityDelegation({
          // this needs to be the full object (if not delegating the root
          // zcap), so can't use the local `parentCapability` var from above
          // that holds just the ID value
          parentCapability: capability
        })
      });

    return signedDelegatedCapability;
  }

  /**
   * Performs an HTTP request given an Authorization Capability (zcap) and/or
   * a target URL. If no URL is given, the invocation target from the
   * capability will be used. If a capability is given as a string, it MUST
   * be a root capability. If both a capability and a URL are given, then
   * the capability's invocation target MUST be a RESTful prefix of or
   * equivalent to the URL.
   *
   * @param {object} options - The options to use.
   * @param {string} [options.url] - The URL to invoke the
   *   Authorization Capability against; if not provided, a `capability` must
   *   be provided instead.
   * @param {string|object} [options.capability] - The capability to invoke at
   *   the given URL. Default: generate root capability from options.url.
   * @param {string} [options.method] - The HTTP method to use when accessing
   *   the resource. Default: 'get'.
   * @param {string} [options.action] - The capability action that is being
   *   invoked. Default: 'read'.
   * @param {object} [options.headers] - The additional headers to sign and
   *   send along with the HTTP request. Default: {}.
   * @param {object} options.json - The JSON object, if any, to send with the
   *   request.
   *
   * @returns {Promise<object>} - A promise that resolves to an HTTP response.
   */
  async request({
    url,
    capability,
    method = 'get',
    action = 'read',
    headers = {},
    json
  } = {}) {
    if(!this.invocationSigner) {
      throw new Error('"invocationSigner" was not provided in constructor.');
    }

    // get invocation target from zcap
    let invocationTarget;
    if(typeof capability === 'string') {
      // capability MUST be a root zcap
      if(!capability.startsWith(ZCAP_ROOT_PREFIX)) {
        throw new Error(
          'When "capability" is a string, it must be a root authorization ' +
          'capability.');
      }
      invocationTarget = decodeURIComponent(
        capability.substring(ZCAP_ROOT_PREFIX.length));
      if(!invocationTarget.startsWith('https://')) {
        throw new Error(
          'When "capability" is a string, it must be a root ' +
          'authorization capability with an HTTPS invocation target.');
      }
    } else if(capability !== undefined) {
      try {
        _checkZcap({capability});
      } catch(cause) {
        const error = new Error(
          '"capability" must be a valid authorization capability object.');
        error.cause = cause;
        throw error;
      }
      invocationTarget = capability.invocationTarget;
    }

    // set `url` to invocation target if not given
    if(url === undefined) {
      if(!capability) {
        throw new TypeError(
          'If no "url" is given, "capability" must be given.');
      }
      url = invocationTarget;
    } else if(capability) {
      // if `url` and `capability` are both given, then `invocationTarget`
      // MUST be a RESTful prefix for `url` or equivalent to it to avoid
      // confused deputy (don't invoke zcaps against URLs that are in different
      // authority heirarchies)
      if(!(url.startsWith(invocationTarget + '/') ||
        url === invocationTarget)) {
        throw new TypeError(
          `When "url" and "capability" are both given, the capability's ` +
          '"invocationTarget" must be a RESTful prefix of "url" or equal ' +
          'to "url".');
      }
    }

    const {agent, invocationSigner} = this;

    // sign the zcap headers
    const signatureHeaders = await signCapabilityInvocation({
      url,
      method,
      headers: {
        ...headers,
        date: new Date().toUTCString()
      },
      json,
      invocationSigner,
      capability: capability || await generateZcapUri({url}),
      capabilityAction: action
    });

    // build the final request
    const options = {
      method,
      json,
      agent,
      headers: {...this.defaultHeaders, ...signatureHeaders}
    };

    return httpClient(url, options);
  }

  /**
   * Convenience function that invokes an Authorization Capability against a
   * given URL to perform a read operation.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The URL to invoke the
   *   Authorization Capability against.
   * @param {object} options.headers - The additional headers to sign and
   *   send along with the HTTP request.
   * @param {string} [options.capability] - The capability to invoke at the
   *   given URL. Default: generate root capability from options.url.
   *
   * @returns {Promise<object>} - A promise that resolves to an HTTP response.
   */
  async read({
    url,
    headers = {},
    capability
  } = {}) {
    return this.request({
      url, capability, method: 'get', action: 'read', headers
    });
  }

  /**
   * Convenience function that invokes an Authorization Capability against a
   * given URL to perform a write operation.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The URL to invoke the
   *   Authorization Capability against.
   * @param {object} options.json - The JSON object, if any, to send with the
   *   request.
   * @param {object} [options.headers] - The additional headers to sign and
   *   send along with the HTTP request.
   * @param {string} [options.capability] - The capability to invoke at the
   *   given URL. Default: generate root capability from options.url.
   *
   * @returns {Promise<object>} - A promise that resolves to an HTTP response.
   */
  async write({
    url,
    json,
    headers = {},
    capability
  } = {}) {
    return this.request({
      url, capability, method: 'post', action: 'write', headers, json
    });
  }
}

function _checkZcap({capability}) {
  const {
    '@context': context,
    id, parentCapability, invocationTarget, allowedAction, expires
  } = capability;

  const isRoot = parentCapability === undefined;
  if(isRoot) {
    if(context !== ZCAP_CONTEXT_URL) {
      throw new Error(
        'Root capability must have an "@context" value of ' +
        `"${ZCAP_CONTEXT_URL}".`);
    }
    if(capability.expires !== undefined) {
      throw new Error(
        'Root capability must not have an "expires" field.');
    }
  } else {
    if(!((Array.isArray(context) && context[0] === ZCAP_CONTEXT_URL))) {
      throw new Error(
        'Delegated capability must have an "@context" array ' +
        `with "${ZCAP_CONTEXT_URL}" in its first position.`);
    }
    if(!(typeof parentCapability === 'string' &&
      parentCapability.includes(':'))) {
      throw new Error(
        'Delegated capability must have a "parentCapability" with a string ' +
        'value that expresses an absolute URI.');
    }
    const [proof] = exports.getDelegationProofs({capability});
    if(!proof) {
      throw new Error('Delegated capability must have a "proof".');
    }
    if(isNaN(Date.parse(proof.created))) {
      throw new Error(
        'Delegated capability must have a valid proof "created" date.');
    }
    if(isNaN(Date.parse(expires))) {
      throw new Error('Delegated capability must have a valid expires date.');
    }
  }

  if(!(typeof id === 'string' && id.includes(':'))) {
    throw new Error(
      'Capability must have an "id" with a string value that expresses an ' +
      'absolute URI.');
  }
  if(!(typeof invocationTarget === 'string' &&
    invocationTarget.includes(':'))) {
    throw new Error(
      'Capability must have an "invocationTarget" with a string value that ' +
      'expresses an absolute URI.');
  }
  if(allowedAction !== undefined && !(
    typeof allowedAction === 'string' ||
    (Array.isArray(allowedAction) && allowedAction.length > 0))) {
    throw new Error(
      'If present on a capability, "allowedAction" must be a string or a ' +
      'non-empty array.');
  }
}
