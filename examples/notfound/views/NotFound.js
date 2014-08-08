/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

function NotFound(props) {
  return (
    <App>
      <div className="NotFound">
        <h1>Not Found</h1>
        <p>{props.msg}</p>
      </div>
    </App>
  );
}


module.exports = NotFound;
