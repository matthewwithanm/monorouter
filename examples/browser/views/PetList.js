/** @jsx React.DOM */
var React = require('react');

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
    <ul className="PetList">
      {links}
    </ul>
  );
}

module.exports = PetList;
