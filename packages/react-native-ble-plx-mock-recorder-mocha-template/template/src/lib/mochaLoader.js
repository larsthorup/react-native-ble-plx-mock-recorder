/* global mocha */
// Note: we need the embeddable version of mocha, not the CLI
import '../../node_modules/mocha/mocha.js';
import mochaConfig from '../../.mocharc.js';

// Note: this mocha initialization needs to run BEFORE we import *.test.js
// which is why it needs to be imported from this file, instead of inlined
global.location = {};
mocha.setup('bdd');
mocha.timeout(mochaConfig.timeout || 2000);

export default mocha;
