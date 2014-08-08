/** @jsx React.DOM */
var React = require('react');
var App = require('./App');

function PetDetail(props) {
  var metaTags = [
    <meta name="description" content={props.petName + " is a cool pet"} />,
    <meta name="keywords" content={"pets," + props.petName} />
  ];
  return (
    <App title={props.petName + " is a Cool Pet"} headExtras={metaTags}>
      <div className="PetDetail">
        <h1>{props.petName}</h1>
        <a href="/">See all pets!</a>
      </div>
    </App>
  );
}


module.exports = PetDetail;
