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
  const delegationSigner =
    keyPairs.get(didDocument.capabilityDelegation[0]).signer();
  const invocationSigner =
    keyPairs.get(didDocument.capabilityInvocation[0]).signer();

  delegationSigner.id = didDocument.capabilityDelegation[0];
  delegationSigner.controller = didDocument.id;
  invocationSigner.id = didDocument.capabilityInvocation[0];
  invocationSigner.controller = didDocument.id;

  return {invocationSigner, delegationSigner};
}
