/*!
 * Copyright (c) 2020-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as didKey from '@digitalbazaar/did-method-key';
import chai from 'chai';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {getCapabilitySigners, ZcapClient} from '../../';

chai.should();
const {expect} = chai;
const didKeyDriver = didKey.driver();

describe('ZcapClient', () => {
  describe('constructor', () => {
    it('should create an ZcapClient using a didDocument', async () => {
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        didDocument, keyPairs
      });

      expect(zcapClient).to.exist;
    });
    it('should create an ZcapClient using signers', async () => {
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner, delegationSigner
      });

      expect(zcapClient).to.exist;
    });
    it('should delegate a root zcap', async () => {
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner, delegationSigner
      });
      expect(zcapClient).to.exist;

      const url = 'https://zcap.example/items';
      const controller =
        'did:key:z6MkogR2ZPr4ZGvLV2wZ7cWUamNMhpg3bkVeXARDBrKQVn2c';
      const delegatedZcap = await zcapClient.delegate({
        invocationTarget: url, controller
      });

      delegatedZcap.parentCapability.should.equal(
        'urn:zcap:root:' + encodeURIComponent(url));
      delegatedZcap.controller.should.equal(controller);
      delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
      delegatedZcap.proof.capabilityChain.should.have.length(1);
    });
    it('should delegate a deeper zcap chain', async () => {
      const {didDocument, keyPairs} = await didKeyDriver.generate();
      const {invocationSigner, delegationSigner} = getCapabilitySigners({
        didDocument, keyPairs});
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner, delegationSigner
      });
      expect(zcapClient).to.exist;

      // first delegate root zcap
      let delegationDepth1;
      {
        const url = 'https://zcap.example/items';
        // delegate to self to allow deeper delegation without needing to
        // create another entity
        const controller = didDocument.id;
        const delegatedZcap = await zcapClient.delegate(
          {invocationTarget: url, controller});

        delegatedZcap.parentCapability.should.equal(
          'urn:zcap:root:' + encodeURIComponent(url));
        delegatedZcap.controller.should.equal(controller);
        delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
        delegatedZcap.proof.capabilityChain.should.have.length(1);

        delegationDepth1 = delegatedZcap;
      }

      // now delegate zcap again, creating a deeper chain
      let delegationDepth2;
      {
        // delegate to self to allow deeper delegation without needing to
        // create another entity
        const controller = didDocument.id;
        const delegatedZcap = await zcapClient.delegate(
          {capability: delegationDepth1, controller});

        delegatedZcap.parentCapability.should.equal(delegationDepth1.id);
        delegatedZcap.controller.should.equal(controller);
        delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
        delegatedZcap.proof.capabilityChain.should.have.length(2);

        delegationDepth2 = delegatedZcap;
      }

      // now delegate zcap again, creating a deeper chain
      {
        const controller =
          'did:key:z6MkogR2ZPr4ZGvLV2wZ7cWUamNMhpg3bkVeXARDBrKQVn2c';
        const delegatedZcap = await zcapClient.delegate(
          {capability: delegationDepth2, controller});

        delegatedZcap.parentCapability.should.equal(delegationDepth2.id);
        delegatedZcap.controller.should.equal(controller);
        delegatedZcap.proof.proofPurpose.should.equal('capabilityDelegation');
        delegatedZcap.proof.capabilityChain.should.have.length(3);
      }
    });
  });
});
