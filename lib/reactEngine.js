var React = require('react');

module.exports = {
  renderInto: function(router, element) {
    React.renderComponent(router.render(), element);
  },
  renderToString: function(router) {
    return React.renderComponentToString(router.render());
  }
};
