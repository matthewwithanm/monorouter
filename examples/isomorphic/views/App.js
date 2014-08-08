/** @jsx React.DOM */
var React = require('react');

function App(props, children) {
  return (
    <html>
      <head>
        <title>Isomorphic Example</title>
      </head>
      <body>
        {children}
        <script type="text/javascript" src="/browser.js"></script>
      </body>
    </html>
  );
};


module.exports = App;
