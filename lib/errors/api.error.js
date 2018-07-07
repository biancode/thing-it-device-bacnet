"use strict";

var BaseError = require("./base.error");

function APIError() {
    BaseError.apply(this, arguments);
    this.name = 'APIError';
}

APIError.prototype = Object.create(BaseError.prototype);
APIError.prototype.constructor = APIError;

module.exports = APIError;
