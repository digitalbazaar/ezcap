/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import {DEFAULT_HEADERS, httpClient} from '@digitalbazaar/http-client';
import {SECURITY_CONTEXT_V2_URL} from 'jsonld-signatures';
import {CapabilityDelegation} from 'ocapld';
import {generateId} from 'bnid';
import jsigs from 'jsonld-signatures';
import {signCapabilityInvocation} from 'http-signature-zcap-invoke';
const {Ed25519Signature2018} = jsigs.suites;

export class ZcapClient {
  /**
   * An object that can make HTTPS requests such as node's https.Agent or ky.
   *
   * @typedef {object} httpsAgent
   * @see https://nodejs.org/api/https.html#https_class_https_agent
   *
   * Creates a new ZcapClient instance that can be used to perform
   * Authorization Capability (ZCAP) requests against HTTP URLs.
   *
   * @param {object} options - The options to use.
   * @param {string} options.baseUrl - The base URL for the client to use
   *   when building invocation request URLs.
   * @param {object} [options.defaultHeaders] - The optional default HTTP
   *   headers to include in every invocation request.
   * @param {object} [options.agent] - An optional HttpsAgent to use to
   *   when performing HTTPS requests.
   * @param {object} options.invocationSigner - An object with a
   *   `.sign()` function and key `id` parameter that will be used for
   *   signing the request.
   * @param {object} options.delegationSigner - An object with a
   *   `.sign()` function and key `id` parameter that will be used for
   *   signing a capability delegation.
   *
   * @returns {ZcapClient} - The new ZcapClient instance.
   */
  constructor({
    baseUrl, defaultHeaders = {}, agent, invocationSigner, delegationSigner
  } = {}) {
    this.baseUrl = baseUrl;
    this.agent = agent;
    this.defaultHeaders = {...DEFAULT_HEADERS, ...defaultHeaders};
    this.invocationSigner = invocationSigner;
    this.delegationSigner = delegationSigner;
  }

  /**
   * Delegates an Authorization Capability to a specified delegatee.
   *
   * @param {object} options - The options to use.
   * @param {string} [options.url] - The relative URL to invoke the
   *   Authorization Capability against. Either `url` or `capability` must
   *   be specified.
   * @param {string} [options.capability] - The relative URL to invoke the
   *   Authorization Capability against. Either `capability` or `url` must
   *   be specified.
   * @param {string} options.delegate - The URL identifying the entity to
   *   delegate to.
   * @param {string} [options.expires] - Optional expiration value for the
   *   delegation. Default is 5 minutes into the future.
   * @param {string|Array} [options.allowedActions] - Optional list of allowed
   *   actions or string specifying allowed delegated action. Default: [] -
   *   delegate all actions.
   *
   * @returns {object} - A promise that resolves to an HTTP response.
   */
  async delegate({
    url, capability, delegate, expires, allowedActions = []
  } = {}) {
    let delegatedCapability;

    // convert string value for allowedActions to array
    allowedActions = (typeof allowedActions === 'string') ?
      allowedActions = [allowedActions] : allowedActions;

    // use a default expiration if one doesn't exist
    if(expires === 'undefined') {
      // default expiration is 5 minutes in the future
      expires = new Date(+new Date() + 5 * 60 * 1000).toISOString();
    }

    if(url) {
      // generate the root capability
      delegatedCapability = {
        '@context': SECURITY_CONTEXT_V2_URL,
        id: `urn:zcap:${await generateId()}`,
        parentCapability: 'urn:zcap:' + url,
        invocationTarget: url,
        controller: delegate,
        expires
      };
    } else {
      delegatedCapability = {
        // use a provided capability
        '@context': SECURITY_CONTEXT_V2_URL,
        id: `urn:zcap:${await generateId()}`,
        parentCapability: capability.id,
        invocationTarget: capability.invocationTarget,
        controller: delegate,
        expires
      };
    }

    if(allowedActions.length > 0) {
      delegatedCapability.allowedActions = allowedActions;
    }

    const signedDelegatedCapability = await jsigs.sign(
      delegatedCapability, {
        suite: new Ed25519Signature2018({
          signer: this.delegationSigner
        }),
        purpose: new CapabilityDelegation({
          capabilityChain: [
            'urn:zcap:' + url,
            capability || delegatedCapability
          ]
        })
      });

    return signedDelegatedCapability;
  }

  /**
   * Invokes an Authorization Capability against a given URL.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The relative URL to invoke the
   *   Authorization Capability against.
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
  async invoke({
    url,
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
      capability: 'urn:zcap:' + absUrl,
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
   *
   * @returns {Promise<object>} - A promise that resolves to an HTTP response.
   */
  async read({
    url,
    headers = {}
  } = {}) {
    return this.invoke({url, method: 'get', action: 'read', headers});
  }

  /**
   * Convenience function that invokes an Authorization Capability against a
   * given URL to perform a write operation.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The relative URL to invoke the
   *   Authorization Capability against.
   * @param {object} options.headers - The additional headers to sign and
   *   send along with the HTTP request.
   * @param {object} options.json - The JSON object, if any, to send with the
   *   request.
   *
   * @returns {Promise<object>} - A promise that resolves to an HTTP response.
   */
  async write({
    url,
    headers = {},
    json = undefined
  } = {}) {
    return this.invoke({url, method: 'post', action: 'write', headers, json});
  }

}
