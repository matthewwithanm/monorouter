/** @jsx React.DOM */
var React = require('react');
var App = require('./App');
var ReactTemplate = require('react-template');

var pets = [
  {name: 'Winston'},
  {name: 'Chaplin'},
  {name: 'Bennie'}
];

var PetList = ReactTemplate.create({
  renderLinks: function() {
    return pets.map(function(pet) {
      return <li><a href={"/pet/" + pet.name.toLowerCase()}>{pet.name}</a></li>;
    });
  },
  render: function() {
    return (
      <App>
        <ul className="PetList">
          {this.renderLinks()}
        </ul>
      </App>
    );
  }
});

module.exports = PetList;
