var History = require('./History');

var singleton;

function getHistory() {
  if (!singleton)
    singleton = new History();
  return singleton;
}

module.exports = getHistory;
