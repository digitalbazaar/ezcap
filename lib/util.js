/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */

// module API
const api = {};
module.exports = api;

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
api.getCapabilitySigners = ({didDocument, keyPairs}) => {
  const delegationSigner =
    keyPairs.get(didDocument.capabilityDelegation[0]).signer();
  const invocationSigner =
    keyPairs.get(didDocument.capabilityInvocation[0]).signer();

  return {invocationSigner, delegationSigner};
};
