import { Buffer } from 'buffer';

import { expect } from 'chai';

import {
  printableFromBase64,
  base64FromString,
  bufferFromBase64,
  stringFromBase64,
  isPrintableFromBase64,
} from './base64.js';

describe('base64', () => {
  describe(stringFromBase64.name, () => {
    it('should decode strings', () => {
      expect(stringFromBase64('')).to.equal('');
      expect(stringFromBase64('Z2Rj')).to.equal('gdc');
    });
  });

  describe(base64FromString.name, () => {
    it('should encode strings', () => {
      expect(base64FromString('')).to.equal('');
      expect(base64FromString('gdc')).to.equal('Z2Rj');
    });
  });

  describe(bufferFromBase64.name, () => {
    it('should decode binary data', () => {
      expect(bufferFromBase64('AAAAAAAAAAA=').equals(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]))).to.be.true;
    });
  });

  describe(printableFromBase64.name, () => {
    it('should decode only printable characters', () => {
      expect(printableFromBase64('Z2Rj')).to.equal('gdc');
      expect(printableFromBase64(base64FromString('a\bx\n'))).to.equal('a?x?');
      expect(printableFromBase64('AAAAAAAAAAA=')).to.equal('????????');
    });
  });

  describe(isPrintableFromBase64.name, () => {
    it('should verify that string is printable', () => {
      expect(isPrintableFromBase64('Z2Rj')).to.equal(true);
      expect(isPrintableFromBase64(base64FromString('a\bx\n'))).to.equal(false);
      expect(isPrintableFromBase64('AAAAAAAAAAA=')).to.equal(false);
    });
  });
});