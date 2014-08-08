/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

var pets = [
  {name: 'Winston'},
  {name: 'Chaplin'},
  {name: 'Bennie'}
];

function PetList() {
  var links = pets.map(function(pet) {
    return <li><a href={"/pet/" + pet.name.toLowerCase()}>{pet.name}</a></li>;
  });
  return (
    <App>
      <ul className="PetList">
        {links}
      </ul>
    </App>
  );
}

module.exports = PetList;
