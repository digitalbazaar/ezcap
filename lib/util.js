/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {constants} from '@digitalbazaar/zcapld';
import uuid from 'uuid-random';

const {ZCAP_ROOT_PREFIX} = constants;

/**
 * Retrieves the first set of capability invocation and delegation signers
 * associated with the `didDocument` from the `keyPairs`.
 *
 * @param {object} options - The options to use.
 * @param {string} options.didDocument - A DID Document containing
 *   verification relationships for capability invocation and delegation.
 * @param {string} options.keyPairs - A map containing keypairs indexed by
 *   key ID.
 *
 * @returns {object} - A valid `invocationSigner` and `delegationSigner`
 *   associated with the didDocument.
 */
export function getCapabilitySigners({didDocument, keyPairs}) {
  const {capabilityDelegation, capabilityInvocation} = didDocument;
  const capabilityDelegationId = (typeof capabilityDelegation[0] === 'string') ?
    capabilityDelegation[0] : capabilityDelegation[0].id;
  const capabilityInvocationId = (typeof capabilityInvocation[0] === 'string') ?
    capabilityInvocation[0] : capabilityInvocation[0].id;

  // ensure didDocument and keyPairs contain the information necessary
  if(!(capabilityDelegation || capabilityInvocation)) {
    throw new Error(
      'didDocument must include "capabilityInvocation" or ' +
      '"capabilityDelegation" properties.');
  }
  if(capabilityDelegation && !capabilityDelegationId) {
    throw new Error(
      'Could not determine didDocument capabilityDelegation identifier.');
  }
  if(capabilityInvocation && !capabilityInvocationId) {
    throw new Error(
      'Could not determine didDocument capabilityInvocation identifier.');
  }

  let delegationKeyPair;
  if(capabilityDelegation) {
    delegationKeyPair = keyPairs.get(capabilityDelegationId);
  }

  let invocationKeyPair;
  if(capabilityInvocation) {
    invocationKeyPair = keyPairs.get(capabilityInvocationId);
  }

  if(!(delegationKeyPair || invocationKeyPair)) {
    throw new Error(
      `didDocument keyPairs contains neither capabilityDelegation key ` +
      `(${capabilityDelegationId}) nor capabilityInvocation key ` +
      `(${capabilityInvocationId}).`);
  }

  let delegationSigner;
  if(delegationKeyPair) {
    delegationSigner = delegationKeyPair.signer();
    delegationSigner.id = capabilityDelegationId;
    delegationSigner.controller = didDocument.id;
  }

  let invocationSigner;
  if(invocationKeyPair) {
    invocationSigner = invocationKeyPair.signer();
    invocationSigner.id = capabilityInvocationId;
    invocationSigner.controller = didDocument.id;
  }

  return {invocationSigner, delegationSigner};
}

/**
 * Generate a zcap URI given a root capability URL or a delegated flag.
 *
 * @param {object} options - The options to use.
 * @param {string} [options.url] - Optional URL identifying the root capability.
 *
 * @returns {string} - A zcap URI.
 */
export async function generateZcapUri({url} = {}) {
  if(url) {
    return `${ZCAP_ROOT_PREFIX}${encodeURIComponent(url)}`;
  }
  return `urn:uuid:${await uuid()}`;
}
