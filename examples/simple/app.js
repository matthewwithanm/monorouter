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
        <h1>{this.props.petName}</h1>
        <a href="/">See all pets!</a>
      </div>
    );
  }
});

var App = function(children) {
  return (
    <html>
      <head>
        <title>Server Example</title>
      </head>
      <body>
        {children}
        <script type="text/javascript" src="/browser.js"></script>
      </body>
    </html>
  );
};


module.exports = App;
