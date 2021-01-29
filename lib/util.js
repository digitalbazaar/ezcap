/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

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
  if(!capabilityDelegation || !capabilityInvocation) {
    throw new Error('didDocument must include both capabilityInvocation and ' +
      'capabilityDelegation properties.');
  }
  if(!capabilityDelegationId) {
    throw new Error(
      'Could not determine didDocument capabilityDelegation identifier.');
  }
  if(!capabilityInvocationId) {
    throw new Error(
      'Could not determine didDocument capabilityInvocation identifier.');
  }
  if(!keyPairs.has(capabilityDelegationId)) {
    throw new Error(
      `didDocument keyPairs do not contain capabilityDelegation key ` +
      `(${capabilityDelegationId}).`);
  }
  if(!keyPairs.has(capabilityInvocationId)) {
    throw new Error(
      `didDocument keyPairs do not contain capabilityInvocation key ` +
      `(${capabilityInvocationId}).`);
  }

  const delegationSigner = keyPairs.get(capabilityDelegationId).signer();
  const invocationSigner = keyPairs.get(capabilityInvocationId).signer();

  delegationSigner.id = capabilityDelegationId;
  delegationSigner.controller = didDocument.id;
  invocationSigner.id = capabilityInvocationId;
  invocationSigner.controller = didDocument.id;

  return {invocationSigner, delegationSigner};
}
