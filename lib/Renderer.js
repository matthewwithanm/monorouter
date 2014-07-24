var React = require('react');


var PropTypes = React.PropTypes;

var Renderer = React.createClass({
  displayName: 'ReactRouterRenderer',
  propTypes: {
    renderFunc: PropTypes.func.isRequired
  },
  render: function() {
    return this.props.renderFunc();
  }
});

module.exports = Renderer;
