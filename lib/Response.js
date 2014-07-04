function Response(request, initialViewProps, router) {
  this._viewProps = initialViewProps || {};
  this.router = router;
};

Response.prototype.setViewProps = function(props) {
  this._viewProps = merge(this._viewProps, props);
  if (this.router && (this.router.pendingRequest === this.request)) {
    this.router.replaceViewProps(this._viewProps);
  }
};

Response.prototype.replaceViewProps = function(props) {
  this._viewProps = props;
  if (this.router && (this.router.pendingRequest === this.request)) {
    this.router.replaceViewProps(this._viewProps);
  }
};

module.exports = Response;
