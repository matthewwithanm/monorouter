var React = require('react');

module.exports = {
  renderInto: function(component, element) {
    React.renderComponent(component, element);
  },
  renderToString: function(component) {
    return React.renderComponentToString(component);
  }
};
