var merge = require('react/lib/merge');

/**
 * An object used for storing the state of the view when there's no Router
 * component (on the server).
 */
function ViewState () {
  this.viewProps = {};
}

ViewState.prototype.setView = function(view) {
  this.view = view;
};

ViewState.prototype.getViewProps = function() {
  return merge(this.viewProps);
};

ViewState.prototype.setViewProps = function(props) {
  this.viewProps = merge(this.viewProps, props);
};

ViewState.prototype.renderView = function() {
  return this.view(this.viewProps);
};

module.exports = ViewState;
