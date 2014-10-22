var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');


function BaseHistory() {}

// Make BaseHistory an event emitter.
inherits(BaseHistory, EventEmitter);

/**
 * Navigate to the provided URL without creating a duplicate history entry if
 * you're already there.
 */
BaseHistory.prototype.navigate = function(url, meta) {
    if (url !== this.currentURL()) {
        this.push(url, meta);
    } else {
        this.replace(url, meta);
    }
};

module.exports = BaseHistory;
