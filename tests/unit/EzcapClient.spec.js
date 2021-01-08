/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import {Ed25519VerificationKey2018}
  from '@digitalbazaar/ed25519-verification-key-2018';
import {ZcapClient} from '../../';
import chai from 'chai';
import didKey from 'did-method-key';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);
chai.should();
const {expect} = chai;
const didKeyDriver = didKey.driver();

describe('ZcapClient', () => {
  describe('constructor', () => {
    it('should create an ZcapClient', async () => {
      const baseUrl = 'https://zcap.example/';
      const keypair = await Ed25519VerificationKey2018.generate();
      const didDoc = await didKeyDriver.keyToDidDoc(keypair);
      const invocationSigner = keypair.signer();
      invocationSigner.id = didDoc.capabilityInvocation[0];
      const zcapClient = new ZcapClient({baseUrl, invocationSigner});

      expect(zcapClient).to.exist();
    });
  });
});
