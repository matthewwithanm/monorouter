/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

function PetList(props) {
  var links = props.pets
    .map(function(pet) {
      return <li><a href={"/pet/" + pet.name.toLowerCase()}>{pet.name}</a></li>;
    })
    .concat([<li><a href={"/pet/fake"}>fake</a></li>]);
  return (
    <App>
      <ul className="PetList">
        {links}
      </ul>
    </App>
  );
}

module.exports = PetList;
