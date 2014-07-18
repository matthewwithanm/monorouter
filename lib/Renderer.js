var React = require('react');


var PropTypes = React.PropTypes;

var Renderer = React.createClass({
  displayName: 'ReactRouterRenderer',
  propTypes: {
    view: PropTypes.func.isRequired,
    routerState: PropTypes.object
  },
  render: function() {
    return this.props.view(this.props.routerState);
  }
});

module.exports = Renderer;
