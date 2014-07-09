/** @jsx React.DOM */
var React = require('react');

var pets = [
  {name: 'Winston'},
  {name: 'Chaplin'},
  {name: 'Bennie'}
];

var PetList = React.createClass({
  render: function() {
    var links = this.props.pets.map(function(pet) {
      return <li><a href={"/pet/" + pet.name.toLowerCase()}>{pet.name}</a></li>;
    });
    return (
      <ul className="PetList">
        {links}
      </ul>
    );
  }
});

var PetDetail = React.createClass({
  render: function() {
    return (
      <div className="PetDetail">
        <h1>{this.props.pet.name}</h1>
        <a href="/">See all pets!</a>
      </div>
    );
  }
});

var App = React.createClass({
  getDefaultProps: function() {
    return {pets: pets};
  },
  renderBody: function() {
    var petName = this.props.petName;
    if (petName) {
      var pet;
      this.props.pets.some(function(p) {
        if (matches = p.name.toLowerCase() == petName) pet = p;
        return matches;
      });
      return <PetDetail pet={pet} />
    } else {
     return <PetList pets={this.props.pets} />
    }
  },
  render: function() {
    return (
      <html>
        <head>
          <title>Server Example</title>
        </head>
        <body>
          {this.renderBody()}
        </body>
      </html>
    );
  }
});

module.exports = App;
