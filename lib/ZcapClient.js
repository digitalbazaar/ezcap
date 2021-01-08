/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import {DEFAULT_HEADERS, httpClient} from '@digitalbazaar/http-client';
import {signCapabilityInvocation} from 'http-signature-zcap-invoke';

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
   * @param {object} options.defaultHeaders - The optional default HTTP headers
   *   to include in every invocation request.
   * @param {object} options.agent - An optional HttpsAgent to use to
   *   when performing HTTPS requests.
   * @param {object} options.invocationSigner - An object that contains a
   *   `.sign()` function and key `id` parameter that will be used for
   *   signing the request.
   *
   * @returns {ZcapClient}.
   */
  constructor(
    {baseUrl, defaultHeaders = {}, agent = undefined, invocationSigner} = {}) {
    this.baseUrl = baseUrl;
    this.agent = agent;
    this.defaultHeaders = {...DEFAULT_HEADERS, ...defaultHeaders};
    this.invocationSigner = invocationSigner;
  }

  /**
   * Invokes an Authorization Capability against a given URL.
   *
   * @param {object} options - The options to use.
   * @param {string} options.url - The relative URL to invoke the
   *   Authorization Capability against.
   * @param {string} options.method - The HTTP method to use when accessing
   *   the resource.
   * @param {string} options.action - The capability action that is being
   *   invoked.
   * @param {object} options.headers - The additional headers to sign and
   *   send along with the HTTP request.
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
    json = undefined
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
