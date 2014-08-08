/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

function Preloader(props) {
  return (
    <App>
      <div className="preloader">
        <h1>Loading...</h1>
      </div>
    </App>
  );
}

module.exports = Preloader;
