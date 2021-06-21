import { expect } from 'chai';

describe('sample', () => {
  let count;

  before(() => {
    count = 0;
  });

  it('should pass', () => {
    ++count;
    expect(2 + 2).to.equal(4);
  });

  it.skip('should report pending', () => { // eslint-disable-line jest/no-disabled-tests
    ++count;
    expect(0 / 0).to.equal(5);
  });

  it('should await async result', async () => {
    ++count;
    const result = await new Promise(resolve => setTimeout(() => resolve(2 + 2), 100));
    expect(result).to.equal(4);
  });

  after(() => {
    expect(count).to.equal(2);
  });
});
