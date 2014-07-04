function Response(request, router) {
  this.router = router;
};

Response.prototype.setViewProps = function(props) {
  this.router.setViewProps(props);
};

Response.prototype.replaceViewProps = function(props) {
  this.router.replaceViewProps(props);
};

module.exports = Response;
