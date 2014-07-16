var React = require('react');

/**
 * Render a response object to a string.
 */
function renderDocumentString(res) {
  var markup = React.renderComponentToString(res.renderView());
  var doctype = res.doctype(); // Guess from contentType if not present.
  return (doctype || '') + markup;
}

module.exports = renderDocumentString;
