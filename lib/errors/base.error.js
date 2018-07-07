"use strict";

function BaseError(message, status) {
    Error.call(this, message);
    this.status = status;
    Error.captureStackTrace(this);
}

BaseError.prototype = Object.create(Error.prototype);
BaseError.prototype.constructor = BaseError;

module.exports = BaseError;
