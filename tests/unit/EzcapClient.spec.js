/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
import dirtyChai from 'dirty-chai';
chai.use(dirtyChai);
chai.should();
const {expect} = chai;

import {EzcapClient} from '../../';

describe('EzcapClient', () => {
  describe('constructor', () => {
    it('should create an EzcapClient', async () => {
      const ezcap = new EzcapClient();

      expect(ezcap).to.exist();
    });
  });
});
