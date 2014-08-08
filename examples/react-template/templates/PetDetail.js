/** @jsx React.DOM */
var React = require('react');
var App = require('./App');
var ReactTemplate = require('react-template');


var PetDetail = ReactTemplate.create({
  render: function () {
    return (
      <App>
        <div className="PetDetail">
          <h1>{this.props.petName}</h1>
          <a href="/">See all pets!</a>
        </div>
      </App>
    );
  }
});

module.exports = PetDetail;
