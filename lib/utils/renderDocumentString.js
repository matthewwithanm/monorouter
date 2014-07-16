var React = require('react');

/**
 * Render a response object to a string.
 */
function renderDocumentString(res) {
  var renderer = Renderer({view: res.view, viewProps: res.state});
  var markup = React.renderComponentToString(renderer);
  var doctype = res.doctype(); // Guess from contentType if not present.
  return (doctype || '') + markup;
}

module.exports = renderDocumentString;
