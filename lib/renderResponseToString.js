var React = require('react');

/**
 * Render a response object to a string.
 */
function renderResponseToString(res) {
  var markup = React.renderComponentToString(res.view());
  var doctype = res.doctype(); // Guess from contentType if not present.
  return (doctype || '') + markup;
}

module.exports = renderResponseToString;
