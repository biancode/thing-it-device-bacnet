"use strict";

var _ = require("lodash");
var Rx = require("rxjs");
var Errors = require("../errors");
var APIBACnetServices = require("../services/bacnet");
var Services = require("../services");
var redux = require("../redux");
var BACnetAction = require("../redux/actions").BACnetAction;
var Entities = require("../entities");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;

function BACnetServiceManager(logger) {
    this.logger = logger;
}
/**
 * Destroys the instance.
 * - removes config (sets `null`)
 * - destroys API Service
 *
 * @return {Promise<any>}
 */
BACnetServiceManager.prototype.destroy = function () {
    this.config = null;
    this.server = null;

    try {
        this.sbCOVTimer.unsubscribe();
    } catch (error) {
        throw new Errors.APIError('BACnetServiceManager - destroy: ' + error);
    }
    finally {
        this.sbCOVTimer = null;
    }
    return Bluebird.resolve();
};
/**
 * initService - sets service options, sets server socket, creates instance
 * of API service.
 *
 * @param  {Interfaces.ServiceManager.Config} conifg - manager configuration
 * @return {void}
 */
BACnetServiceManager.prototype.initManager = function (config, priority) {
    var _this = this;
    this.config = config;
    this.config.priority = priority || 16;
    this.server = redux.store.getState(['bacnet', 'bacnetServer']);
    var covTimerConfig = _.clone(this.config.covTimer);
    // Emits the first tick of the COV Timer
    this.tickCOVTimer(covTimerConfig);
    // Starts the COV Timer
    this.sbCOVTimer = Rx.timer(covTimerConfig.period, covTimerConfig.period)
        .subscribe(function () { return _this.tickCOVTimer(covTimerConfig); });
};
/**
 * Generates the instance of the COVTimer and emits redux `tick` event with
 * instance of the COVTimer.
 *
 * @param  {Interfaces.COVTimer.Config} covTimerConfig - config of the COVTimer
 * @return {void}
 */
BACnetServiceManager.prototype.tickCOVTimer = function (covTimerConfig) {
    var covTimer = new Entities.COVTimer();
    covTimer.init(covTimerConfig);
    BACnetAction.tickCOVTimer(covTimer);
};
/**
 * Creates the API service. Method creates instance of the each BACnet API service.
 *
 * @param  {Logger} logger - instance of the logger
 * @return {APIService} - instance of the API service
 */
BACnetServiceManager.prototype.createAPIService = function (logger) {
    // Uses default logger if api logger is not provided
    var apiLogger = _.isNil(logger) ? this.logger : logger;
    // Creates output socket
    var socket = this.server.getOutputSocket(this.config.dest, apiLogger);
    // Create API Service
    var apiService = new Services.APIService();
    // Create API Confirmed Request Service
    var confirmedReqService = new APIBACnetServices
        .APIConfirmedReqService(apiLogger, socket, this.config.priority);
    apiService.confirmedReq = confirmedReqService;
    // Create API Unconfirmed Request Service
    var unconfirmedReqService = new APIBACnetServices
        .APIUnconfirmedReqService(apiLogger, socket);
    apiService.unconfirmedReq = unconfirmedReqService;
    return apiService;
};

module.exports = BACnetServiceManager;
