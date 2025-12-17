/**
 * Strategy Index
 * Central export point for all strategies
 */

const conservative = require('./conservative');
const balanced = require('./balanced');
const aggressive = require('./aggressive');
const income = require('./income');
const momentum = require('./momentum');
const seasonal = require('./seasonal');
const defensive = require('./defensive');
const scalping = require('./scalping');

module.exports = {
  conservative,
  balanced,
  aggressive,
  income,
  momentum,
  seasonal,
  defensive,
  scalping,
  // Array of all strategies
  all: [
    conservative,
    balanced,
    aggressive,
    income,
    momentum,
    seasonal,
    defensive,
    scalping
  ],
  // Get strategy by name
  getStrategy: (name) => {
    const strategies = {
      conservative,
      balanced,
      aggressive,
      income,
      momentum,
      seasonal,
      defensive,
      scalping
    };
    return strategies[name.toLowerCase()];
  }
};

