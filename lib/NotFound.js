function NotFound(request) {
    var err = new Error('Path not found: ' + request.path);
    this.name = err.name = 'NotFound';
    this.message = err.message;
    this.request = request;
    if (err.stack) {
        this.stack = err.stack;
    }

    this.toString = function () {
        return this.name + ': ' + this.message;
    };
}

NotFound.prototype = Error.prototype;

module.exports = NotFound;
