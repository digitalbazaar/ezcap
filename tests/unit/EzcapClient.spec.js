/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
import {getCapabilitySigners, ZcapClient} from '../../';
import chai from 'chai';
import * as didKey from '@digitalbazaar/did-method-key';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';

chai.should();
const {expect} = chai;
const didKeyDriver = didKey.driver();

describe('ZcapClient', () => {
  describe('constructor', () => {
    it('should create an ZcapClient using a didDocument', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const zcapClient = new ZcapClient({
        baseUrl, didDocument, keyPairs,
        SuiteClass: Ed25519Signature2020
      });

      expect(zcapClient).to.exist;
    });
    it('should create an ZcapClient using signers', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        baseUrl, invocationSigner, delegationSigner,
        SuiteClass: Ed25519Signature2020
      });

      expect(zcapClient).to.exist;
    });
    it('should delegate a root zcap', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        baseUrl, invocationSigner, delegationSigner,
        SuiteClass: Ed25519Signature2020
      });
      expect(zcapClient).to.exist;

      const url = baseUrl + '/items';
      const targetDelegate =
        'did:key:z6MkogR2ZPr4ZGvLV2wZ7cWUamNMhpg3bkVeXARDBrKQVn2c';
      const delegatedZcap = await zcapClient.delegate({url, targetDelegate});

      delegatedZcap.parentCapability.should.equal(
        'urn:zcap:root:' + encodeURIComponent(url));
      delegatedZcap.controller.should.equal(targetDelegate);
      delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
      delegatedZcap.proof.capabilityChain.should.have.length(1);
    });
    it('should delegate a deeper zcap chain', async () => {
      const baseUrl = 'https://zcap.example';
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        baseUrl, invocationSigner, delegationSigner,
        SuiteClass: Ed25519Signature2020
      });
      expect(zcapClient).to.exist;

      // first delegate root zcap
      let delegationDepth1;
      {
        const url = baseUrl + '/items';
        // delegate to self to allow deeper delegation without needing to
        // create another entity
        const targetDelegate = didDocument.id;
        const delegatedZcap = await zcapClient.delegate({url, targetDelegate});

        delegatedZcap.parentCapability.should.equal(
          'urn:zcap:root:' + encodeURIComponent(url));
        delegatedZcap.controller.should.equal(targetDelegate);
        delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
        delegatedZcap.proof.capabilityChain.should.have.length(1);

        delegationDepth1 = delegatedZcap;
      }

      // now delegate zcap again, creating a deeper chain
      let delegationDepth2;
      {
        // delegate to self to allow deeper delegation without needing to
        // create another entity
        const targetDelegate = didDocument.id;
        const delegatedZcap = await zcapClient.delegate(
          {capability: delegationDepth1, targetDelegate});

        delegatedZcap.parentCapability.should.equal(delegationDepth1.id);
        delegatedZcap.controller.should.equal(targetDelegate);
        delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
        delegatedZcap.proof.capabilityChain.should.have.length(2);

        delegationDepth2 = delegatedZcap;
      }

      // now delegate zcap again, creating a deeper chain
      {
        const targetDelegate =
          'did:key:z6MkogR2ZPr4ZGvLV2wZ7cWUamNMhpg3bkVeXARDBrKQVn2c';
        const delegatedZcap = await zcapClient.delegate(
          {capability: delegationDepth2, targetDelegate});

        delegatedZcap.parentCapability.should.equal(delegationDepth2.id);
        delegatedZcap.controller.should.equal(targetDelegate);
        delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
        delegatedZcap.proof.capabilityChain.should.have.length(3);
      }
    });
  });
});
