var React = require('react');

function PetDetail(props) {
  return (
    <div className="PetDetail">
      <h1>{props.petName}</h1>
      <a href="/">See all pets!</a>
    </div>
  );
}


module.exports = PetDetail;
