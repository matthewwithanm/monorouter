/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

function PetList(props) {
  var links = props.pets.map(function(pet) {
    return <li><a href={"/pet/" + pet.name.toLowerCase()}>{pet.name}</a></li>;
  });
  return (
    <App domCache={props.domCache}>
      <ul className="PetList">
        {links}
      </ul>
    </App>
  );
}

module.exports = PetList;
