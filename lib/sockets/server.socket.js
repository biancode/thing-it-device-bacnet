"use strict";

var dgram = require("dgram");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;
var _ = require("lodash");
var Rx = require("rxjs");
var Errors = require("../errors");
var OutputSocket = require("./output.socket");
var Managers = require("../managers");

function ServerSocket(logger) {
    this.logger = logger;
    this.className = 'Server';
}
Object.defineProperty(ServerSocket.prototype, "respFlow", {
    get: function () {
        return this._respFlow;
    },
    enumerable: true,
    configurable: true
});
ServerSocket.prototype.initServer = function (config) {
    // Save configuration
    this.config = config;
    // Create response flow
    this._respFlow = new Rx.Subject();
    // Create sequence manager
    this.sequenceManager = new Managers.SequenceManager();
    this.sequenceManager.initManager(this.config.sequence);
};
/**
 * destroy - destroys the socket connection.
 *
 * @return {Bluebird<any>}
 */
ServerSocket.prototype.destroy = function () {
    var _this = this
    return Bluebird.resolve(this.sequenceManager.destroy())
        .then(function() {
            return new Bluebird(function(resolve, reject) {
                _this._respFlow.unsubscribe();
                _this._respFlow = null;
                _this.sock.close(function() { resolve(); });
            });
        })
};
/**
 * startServer - starts the server.
 *
 * @return {void}
 */
ServerSocket.prototype.startServer = function () {
    var _this = this;
    this.sock = dgram.createSocket({
        type: 'udp4',
        reuseAddr: true
    });
    this.sock.on('error', function (error) {
        _this.logger.logError(_this.className + " - startServer: UDP Error - " + error);
    });
    this.sock.on('message', function (msg, rinfo) {
        // Generate Output Socket
        var outputSoc = _this.getOutputSocket({
            port: rinfo.port, address: rinfo.address,
        });
        _this._respFlow.next({ message: msg, socket: outputSoc });
    });
    var startPromise = new Bluebird(function (resolve, reject) {
        _this.sock.on('listening', function () {
            var addrInfo = _this.sock.address();
            _this.logger.logInfo(_this.className + " - startServer: "
                + ("UDP Server listening on " + addrInfo.address + ":" + addrInfo.port));
            resolve(addrInfo);
        });
    });
    if (!this.config.port) {
        throw new Errors.APIError(this.className + " - startServer: Port is required!");
    }
    this.sock.bind(this.config.port);
    return startPromise;
};
/**
 * genOutputSocket - creates the instance of `Output` socket.
 *
 * @param  {IBACnetAddressInfo} rinfo - object with endpoint address and port
 * @param  {Logger} [logger] - instance of the `Logger`
 * @return {OutputSocket}
 */
ServerSocket.prototype.getOutputSocket = function (rinfo, logger) {
    var apiLogger = _.isNil(logger) ? this.logger : logger;
    var outputSocket = new OutputSocket(apiLogger, this.sock, this.sequenceManager);
    outputSocket.initialize({ rinfo: rinfo });
    return outputSocket;
};

module.exports= ServerSocket;
