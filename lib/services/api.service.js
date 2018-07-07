"use strict";
var _ = require("lodash");
var Errors = require("../errors");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;

function APIService() {
}
Object.defineProperty(APIService.prototype, "confirmedReq", {
    /**
     * Return instance of ConfirmedReq API Service.
     *
     * @type {apiService}
     */
    get: function () {
        return this._confirmedReq;
    },
    /**
     * Set instance of ConfirmedReq API Service. If service already exist, method
     * will skip "set" operation.
     *
     * @type {apiService}
     */
    set: function (service) {
        if (!_.isNil(this._confirmedReq)) {
            return;
        }
        this._confirmedReq = service;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(APIService.prototype, "unconfirmedReq", {
    /**
     * Return instance of UnconfirmedReq API Service.
     *
     * @type {apiService}
     */
    get: function () {
        return this._unconfirmedReq;
    },
    /**
     * Set instance of UnconfirmedReq API Service. If service already exist, method
     * will skip "set" operation.
     *
     * @type {apiService}
     */
    set: function (service) {
        if (!_.isNil(this._unconfirmedReq)) {
            return;
        }
        this._unconfirmedReq = service;
    },
    enumerable: true,
    configurable: true
});
/**
 * Destroys the instance.
 * - destroys Confirmed Request Service
 * - destroys Unconfirmed Request Service
 *
 * @return {Promise<any>}
 */
APIService.prototype.destroy = function () {
    var _this = this;
    return Bluebird.resolve(this._confirmedReq.destroy())
        .catch(function(error) {
            throw new Errors.APIError('APIService - destroy: Confirmed Request Service - ' + error);
        })
        .then(function() {
            _this._confirmedReq = null;
            return _this._unconfirmedReq.destroy();
        })
        .catch(function(error) {
            throw new Errors.APIError('APIService - destroy: Unconfirmed Request Service - ' + error);
        })
        .then(function() {
            _this._unconfirmedReq = null;
        })
};

module.exports = APIService;
