/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import {getCapabilitySigners, ZcapClient} from '../../';
import chai from 'chai';
import didKey from 'did-method-key';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);
chai.should();
const {expect} = chai;
const didKeyDriver = didKey.driver();

describe('ZcapClient', () => {
  describe('constructor', () => {
    it('should create an ZcapClient using a didDocument', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const zcapClient = new ZcapClient({baseUrl, didDocument, keyPairs});

      expect(zcapClient).to.exist();
    });
    it('should create an ZcapClient using signers', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        baseUrl, invocationSigner, delegationSigner
      });

      expect(zcapClient).to.exist();
    });
    it('should delegate a zcap', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        baseUrl, invocationSigner, delegationSigner
      });
      expect(zcapClient).to.exist();

      const url = baseUrl + '/items';
      const targetDelegate =
        'did:key:z6MkogR2ZPr4ZGvLV2wZ7cWUamNMhpg3bkVeXARDBrKQVn2c';
      const delegatedZcap = await zcapClient.delegate({url, targetDelegate});

      delegatedZcap.parentCapability.should.equal('urn:zcap:' + url);
      delegatedZcap.controller.should.equal(targetDelegate);
      delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
      delegatedZcap.proof.capabilityChain.should.have.length(1);
    });
  });
});
