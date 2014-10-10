var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');


function BaseHistory() {}

// Make BaseHistory an event emitter.
inherits(BaseHistory, EventEmitter);

/**
 * Navigate to the provided URL without creating a duplicate history entry if
 * you're already there.
 */
BaseHistory.prototype.navigate = function(url) {
    if (url !== this.currentURL()) {
        this.push(url);
    } else {
        this.emit('update');
    }
};

module.exports = BaseHistory;
