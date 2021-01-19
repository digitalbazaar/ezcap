/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
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
      const baseUrl = 'https://zcap.example';
      const didDocument = await didKeyDriver.generate();
      const delegationKeypair =
        didDocument.keys[didDocument.capabilityDelegation[0]];
      const invocationKeypair =
        didDocument.keys[didDocument.capabilityInvocation[0]];
      const zcapClient = new ZcapClient({
        baseUrl, delegationKeypair, invocationKeypair
      });

      expect(zcapClient).to.exist();
    });
    it('should delegate a zcap', async () => {
      const baseUrl = 'https://zcap.example';
      const didDocument = await didKeyDriver.generate();
      const delegationKeypair =
        didDocument.keys[didDocument.capabilityDelegation[0]];
      const invocationKeypair =
        didDocument.keys[didDocument.capabilityInvocation[0]];
      const zcapClient = new ZcapClient({
        baseUrl, delegationKeypair, invocationKeypair
      });
      expect(zcapClient).to.exist();

      const url = baseUrl + '/items';
      const delegate =
        'did:key:z6MkogR2ZPr4ZGvLV2wZ7cWUamNMhpg3bkVeXARDBrKQVn2c';
      const delegatedZcap = await zcapClient.delegate({url, delegate});

      delegatedZcap.parentCapability.should.equal('urn:zcap:' + url);
      delegatedZcap.controller.should.equal(delegate);
      delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
      delegatedZcap.proof.capabilityChain.should.have.length(2);
      //const delegatedZcap = zcapClient.delegate({capability, delegate});
    });
  });
});
