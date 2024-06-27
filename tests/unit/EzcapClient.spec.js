/*!
 * Copyright (c) 2020-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as didKey from '@digitalbazaar/did-method-key';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import chai from 'chai';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {Ed25519VerificationKey2020} from
  '@digitalbazaar/ed25519-verification-key-2020';
import {ZcapClient} from '../../lib/index.js';

chai.should();
const {expect} = chai;
const didKeyDriver = didKey.driver();

describe('ZcapClient', () => {
  describe('constructor', () => {
    it('should create an ZcapClient using a didDocument', async () => {
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: Ed25519VerificationKey2020.from
      });
      const verificationKeyPair = await Ed25519VerificationKey2020.generate();
      const {didDocument, keyPairs} =
        await didKeyDriver.fromKeyPair({verificationKeyPair});
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        didDocument, keyPairs
      });
      expect(zcapClient).to.exist;
    });
    it('should create an ZcapClient using signers', async () => {
      const verificationKeyPair = await Ed25519VerificationKey2020.generate();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: Ed25519VerificationKey2020.from
      });
      const {didDocument} =
        await didKeyDriver.fromKeyPair({verificationKeyPair});
      // this `id` value manifest as the `verificationMethod` on the proof
      verificationKeyPair.id = didDocument.verificationMethod[0].id;
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner: verificationKeyPair.signer(),
        delegationSigner: verificationKeyPair.signer(),
      });
      expect(zcapClient).to.exist;
    });
    it('should delegate a root zcap', async () => {
      const verificationKeyPair = await Ed25519VerificationKey2020.generate();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: Ed25519VerificationKey2020.from
      });
      const {didDocument} =
        await didKeyDriver.fromKeyPair({verificationKeyPair});
      // this `id` value manifest as the `verificationMethod` on the proof
      // see the assertion below
      verificationKeyPair.id = didDocument.verificationMethod[0].id;
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner: verificationKeyPair.signer(),
        delegationSigner: verificationKeyPair.signer(),
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
      delegatedZcap.proof.verificationMethod.should.equal(
        verificationKeyPair.id);
    });
    it('should delegate a root zcap using Ed25519Multikey', async () => {
      const verificationKeyPair = await Ed25519Multikey.generate();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: Ed25519Multikey.from
      });
      const {didDocument} =
        await didKeyDriver.fromKeyPair({verificationKeyPair});
      // this `id` value manifest as the `verificationMethod` on the proof
      verificationKeyPair.id = didDocument.verificationMethod[0].id;
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner: verificationKeyPair.signer(),
        delegationSigner: verificationKeyPair.signer(),
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
      delegatedZcap.proof.verificationMethod.should.equal(
        verificationKeyPair.id);
    });
    it('should throw error if controller is not provided when delegating zcap',
      async () => {
        const verificationKeyPair = await Ed25519VerificationKey2020.generate();
        didKeyDriver.use({
          multibaseMultikeyHeader: 'z6Mk',
          fromMultibase: Ed25519VerificationKey2020.from
        });
        const {didDocument} =
          await didKeyDriver.fromKeyPair({verificationKeyPair});
        // this `id` value manifest as the `verificationMethod` on the proof
        verificationKeyPair.id = didDocument.verificationMethod[0].id;
        const zcapClient = new ZcapClient({
          SuiteClass: Ed25519Signature2020,
          invocationSigner: verificationKeyPair.signer(),
          delegationSigner: verificationKeyPair.signer(),
        });
        expect(zcapClient).to.exist;
        const url = 'https://zcap.example/items';
        let err;
        let delegatedZcap;
        try {
          await zcapClient.delegate({
            invocationTarget: url
          });
        } catch(e) {
          err = e;
        }
        expect(delegatedZcap).to.not.exist;
        expect(err).to.exist;
        err.message.should.equal(
          '"controller" must be a string expressing an absolute URI.');
      });
    it('should delegate a deeper zcap chain', async () => {
      const verificationKeyPair = await Ed25519VerificationKey2020.generate();
      didKeyDriver.use({
        multibaseMultikeyHeader: 'z6Mk',
        fromMultibase: Ed25519VerificationKey2020.from
      });
      const {didDocument} =
        await didKeyDriver.fromKeyPair({verificationKeyPair});
      // this `id` value manifest as the `verificationMethod` on the proof
      verificationKeyPair.id = didDocument.verificationMethod[0].id;
      const zcapClient = new ZcapClient({
        SuiteClass: Ed25519Signature2020,
        invocationSigner: verificationKeyPair.signer(),
        delegationSigner: verificationKeyPair.signer(),
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
