var urllite = require('urllite');
require('urllite/lib/extensions/toString');


/**
 * A utility for hijacking link clicks and forwarding them to the router.
 */
function LinkHijacker(router, el) {
  this.router = router;
  this.element = el || window;
  this.handleClick = this.handleClick.bind(this);
  this.start();
}

LinkHijacker.prototype.start = function() {
  // This handler works by trying to route the URL and then, if it was
  // successful, updating the history. If the history object being used doesn't
  // support that, don't bother adding the event listener.
  if (!this.router.history.push) return;

  this.element.addEventListener('click', this.handleClick);
};

LinkHijacker.prototype.stop = function() {
  this.element.removeEventListener('click', this.handleClick);
};

LinkHijacker.prototype.handleClick = function(event) {
  // Ignore canceled events, modified clicks, and right clicks.
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (event.button !== 0) return;

  // Get the <a> element.
  var el = event.target;
  while (el && el.nodeName !== 'A') {
    el = el.parentNode;
  }

  // Ignore clicks from non-a elements.
  if (!el) return;

  // Ignore the click if the element has a target.
  if (el.target && el.target !== '_self') return;

  // Ignore the click if it's a download link. (We use this method of
  // detecting the presence of the attribute for old IE versions.)
  if (!!el.attributes.download) return;

  // Use a regular expression to parse URLs instead of relying on the browser
  // to do it for us (because IE).
  var url = urllite(el.href);
  var windowURL = urllite(window.location.href);

  // Ignore links that don't share a protocol and host with ours.
  if (url.protocol !== windowURL.protocol || url.host !== windowURL.host)
    return;

  // Ignore URLs that don't share the router's rootURL
  if (url.pathname.indexOf(this.router.rootURL) !== 0) return;

  // Ignore 'rel="external"' links.
  if (el.rel && /(?:^|\s+)external(?:\s+|$)/.test(el.rel)) return;

  event.preventDefault();

  // Dispatch the URL.
  var fullPath = url.pathname + url.search + url.hash;
  this.router.history.push(fullPath);
};

module.exports = LinkHijacker;
