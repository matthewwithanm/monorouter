/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

function PetDetail(props) {
  return (
    <App>
      <div className="PetDetail">
        <h1>{props.petName}</h1>
        <a href="/">See all pets!</a>
      </div>
    </App>
  );
}


module.exports = PetDetail;
