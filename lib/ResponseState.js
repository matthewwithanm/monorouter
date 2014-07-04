var merge = require('react/lib/merge');

/**
 * An object used for storing the state of the response when there's no Router
 * component (on the server).
 */
function ResponseState () {
  this.viewProps = {};
}

ResponseState.prototype.setView = function(view) {
  this.view = view;
};

ResponseState.prototype.getViewProps = function() {
  return merge(this.viewProps);
};

ResponseState.prototype.setViewProps = function(props) {
  this.viewProps = merge(this.viewProps, props);
};

ResponseState.prototype.renderView = function() {
  return this.view(this.viewProps);
};

module.exports = ResponseState;
