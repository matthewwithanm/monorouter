/** @jsx React.DOM */
var React = require('react');

function App(props, children) {
  return (
    <html>
      <head>
        <title>Lazy Load Views Example</title>
      </head>
      <body>
        {children}
        <script type="text/javascript" src="/assets/browser.js"></script>
      </body>
    </html>
  );
};


module.exports = App;
