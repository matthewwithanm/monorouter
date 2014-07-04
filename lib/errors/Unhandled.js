function Unhandled(request) {
    var err = new Error('Path not found: ' + request.path);
    this.name = err.name = 'Unhandled';
    this.message = err.message;
    this.request = request;
    if (err.stack) {
        this.stack = err.stack;
    }

    this.toString = function () {
        return this.name + ': ' + this.message;
    };
}

Unhandled.prototype = Error.prototype;

module.exports = Unhandled;
