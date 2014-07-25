var PushStateHistory = require('./PushStateHistory');
var FallbackHistory = require('./FallbackHistory');


var win = typeof window !== 'undefined' ? window : null;
var history = win && win.history;

module.exports = history && history.pushState ? PushStateHistory : FallbackHistory;
