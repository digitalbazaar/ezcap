/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {DEFAULT_HEADERS, httpClient} from '@digitalbazaar/http-client';
import {SECURITY_CONTEXT_V2_URL} from 'jsonld-signatures';
import {CapabilityDelegation} from '@digitalbazaar/zcapld';
import {generateZcapUri, getCapabilitySigners} from './util.js';
import jsigs from 'jsonld-signatures';
import {signCapabilityInvocation} from 'http-signature-zcap-invoke';
import {Ed25519Signature2020, suiteContext} from
  '@digitalbazaar/ed25519-signature-2020';

/**
 * An object that manages connection persistence and reuse for HTTPS requests.
 *
 * @typedef {object} HttpsAgent
 * @see https://nodejs.org/api/https.html#https_class_https_agent
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
   * @param {string} options.baseUrl - The base URL for the client to use
   *   when building invocation request URLs.
   * @param {object} [options.didDocument] - A DID Document that contains
   *   the `capabilityInvocation` and `capabilityDelegation` verification
   *   relationships. `didDocument` and `keyPairs`, or `invocationSigner` and
   *   `delegationSigner` must be provided.
   * @param {Map} [options.keyPairs] - A map of key pairs associated with
   *   `didDocument` indexed by key pair. `didDocument` and `keyPairs`, or
   *   `invocationSigner` and `delegationSigner` must be provided.
   * @param {object} [options.defaultHeaders] - The optional default HTTP
   *   headers to include in every invocation request.
   * @param {HttpsAgent} [options.agent] - An optional HttpsAgent to use to
   *   when performing HTTPS requests.
   * @param {object} [options.invocationSigner] - An object with a
   *   `.sign()` function and `id` and `controller` properties that will be
   *   used for signing requests. `invocationSigner` and `delegationSigner`, or
   *   `didDocument` and `keyPairs` must be provided.
   * @param {object} [options.delegationSigner] - An object with a
   *   `.sign()` function and `id` and `controller` properties that will be
   *   used for signing requests. `invocationSigner` and `delegationSigner`, or
   *   `didDocument` and `keyPairs` must be provided.
   *
   * @returns {ZcapClient} - The new ZcapClient instance.
   */
  constructor({
    baseUrl, defaultHeaders = {}, agent, didDocument, keyPairs,
    invocationSigner, delegationSigner
  } = {}) {
    this.baseUrl = baseUrl;
    this.agent = agent;
    this.defaultHeaders = {...DEFAULT_HEADERS, ...defaultHeaders};

    // set the appropriate invocation and delegation signers
    if(didDocument && keyPairs) {
      const signers = getCapabilitySigners({didDocument, keyPairs});
      this.invocationSigner = signers.invocationSigner;
      this.delegationSigner = signers.delegationSigner;
    } else if(invocationSigner && delegationSigner) {
      this.invocationSigner = invocationSigner;
      this.delegationSigner = delegationSigner;
    } else {
      throw new Error(
        'Either `didDocument` and `keyPairs`, or `invocationSigner` and ' +
        '`delegationSigner` must be provided.');
    }
  }

  /**
   * Delegates an Authorization Capability to a target delegate.
   *
   * @param {object} options - The options to use.
   * @param {string} [options.url] - The relative URL to invoke the
   *   Authorization Capability against, aka the `invocationTarget`. Either
   *  `url` or `capability` must be specified.
   * @param {string} [options.capability] - The parent capability to delegate.
   *   Either `url` or `capability` must be specified.
   * @param {string} options.targetDelegate - The URL identifying the entity to
   *   delegate to.
   * @param {string} [options.invocationTarget] - Optional invocation target
   *   to use when narrowing a `capability`'s existing invocationTarget.
   *   Default is to use `url` if `capability` is not provided, or
   *   `capability.invocationTarget` if `capability` is provided.
   * @param {string} [options.expires] - Optional expiration value for the
   *   delegation. Default is 5 minutes after `Date.now()`.
   * @param {string|Array} [options.allowedActions] - Optional list of allowed
   *   actions or string specifying allowed delegated action. Default: [] -
   *   delegate all actions.
   *
   * @returns {Promise<object>} - A promise that resolves to a delegated
   *   capability.
   */
  async delegate({
    url, capability, targetDelegate, invocationTarget, expires,
    allowedActions = []
  } = {}) {
    let delegatedCapability;

    // convert string value for allowedActions to array
    allowedActions = (typeof allowedActions === 'string') ?
      allowedActions = [allowedActions] : allowedActions;

    // default expiration is 5 minutes in the future
    const defaultExpires =
      new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, -5) + 'Z';

    if(url) {
      delegatedCapability = {
        '@context': [
          SECURITY_CONTEXT_V2_URL,
          suiteContext.constants.CONTEXT_URL,
        ],
        id: await generateZcapUri(),
        // use generated root capability as parent
        parentCapability: await generateZcapUri({url}),
        invocationTarget: url,
        controller: targetDelegate,
        expires: expires || defaultExpires
      };
    } else {
      delegatedCapability = {
        '@context': [
          SECURITY_CONTEXT_V2_URL,
          suiteContext.constants.CONTEXT_URL,
        ],
        id: await generateZcapUri(),
        // use a provided capability as parent
        parentCapability: capability.id,
        invocationTarget: invocationTarget || capability.invocationTarget,
        controller: targetDelegate,
        expires: expires || defaultExpires
      };
    }

    if(allowedActions.length > 0) {
      delegatedCapability.allowedActions = allowedActions;
    }

    const signedDelegatedCapability = await jsigs.sign(
      delegatedCapability, {
        suite: new Ed25519Signature2020({
          signer: this.delegationSigner,
          verificationMethod: this.delegationSigner.id
        }),
        purpose: new CapabilityDelegation({
          capability,
          capabilityChain: (url) ? [await generateZcapUri({url})] : undefined
        }),
        // FIXME: could jsonld-signatures just get the context from the suite?
        documentLoader: suiteContext.documentLoader,
      });

    return signedDelegatedCapability;
  }

  /**
   * Performs an HTTP request given an Authorization Capability and
   * a target URL.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The relative URL to invoke the
   *   Authorization Capability against.
   * @param {string} [options.capability] - The capability to invoke at the
   *   given URL. Default: generate root capability from options.url.
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
    const {baseUrl, agent} = this;
    const absUrl = `${baseUrl}${url}`;

    // sign the zcap headers
    const signatureHeaders = await signCapabilityInvocation({
      url: absUrl,
      method,
      headers: {
        ...headers,
        date: new Date().toUTCString()
      },
      json,
      invocationSigner: this.invocationSigner,
      capability: capability || await generateZcapUri({url: absUrl}),
      capabilityAction: action
    });

    // build the final request
    const options = {
      method,
      json,
      agent,
      headers: {...this.defaultHeaders, ...signatureHeaders}
    };

    return httpClient(absUrl, options);
  }

  /**
   * Convenience function that invokes an Authorization Capability against a
   * given URL to perform a read operation.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The relative URL to invoke the
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
   * @param {string} options.url - The relative URL to invoke the
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
