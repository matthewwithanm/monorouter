/** @jsx React.DOM */
var React = require('react');
var head = require('react-frozenhead');

function App(props, children) {
  return (
    <html>
      <head>
        <title>{props.title + " :: React Frozenhead Example"}</title>
        {props.headExtras}
      </head>
      <body>
        {children}
        <script type="text/javascript" src="/browser.js"></script>
      </body>
    </html>
  );
};


module.exports = App;
