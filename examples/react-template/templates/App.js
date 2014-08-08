/** @jsx React.DOM */
var React = require('react');
var ReactTemplate = require('react-template');


var App = ReactTemplate.create({
  render: function() {
    return (
      <html>
        <head>
          <title>ReactTemplate Example</title>
        </head>
        <body>
          {this.props.children}
          <script type="text/javascript" src="/browser.js"></script>
        </body>
      </html>
    );
  }
});


module.exports = App;
