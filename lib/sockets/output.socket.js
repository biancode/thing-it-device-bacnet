"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Bluebird = require("bluebird");
var BroadcastAddress = "255.255.255.255";

function OutputSocket(logger, socket, seqManager) {
    this.logger = logger;
    this.socket = socket;
    this.seqManager = seqManager;
    this.className = 'OutputSocket';
}
/**
    * Initializes the `output` socket.
    * - sets configuration
    *
    * @param  {Interfaces.ServerSocket.Request} config - configuration of the `output` socket
    * @return {Promise<void>}
    */
OutputSocket.prototype.initialize = function (config) {
    this.config = config;
};
/**
    * Destroys the instance of the `output` socket.
    * - removes config (sets `null`)
    * - removes socket (sets `null`)
    * - removes seqManager (sets `null`)
    * - removes logger (sets `null`)
    *
    * @return {Promise<void>}
    */
OutputSocket.prototype.destroy = function () {
    this.config = null;
    this.socket = null;
    this.seqManager = null;
    this.logger = null;
};
/**
    * Sends the message by unicast channel.
    *
    * @param  {Buffer} msg - message (bytes)
    * @param  {string} reqMethodName - name of the BACnet service
    * @return {Bluebird<any>}
    */
OutputSocket.prototype._send = function (msg, reqMethodName) {
    var _this = this;
    var ucAddress = this.config.rinfo.address;
    var ucPort = this.config.rinfo.port;
    this.logSendMethods(ucAddress, ucPort, msg, 'send', reqMethodName);
    return new Bluebird(function (resolve, reject) {
        _this.socket.send(msg, 0, msg.length, ucPort, ucAddress, function (error, data) {
            if (error) {
                return reject(error);
            }
            resolve(data);
        });
    });
};
/**
    * Sends the message by unicast channel.
    *
    * @param  {Buffer} msg - message (bytes)
    * @param  {string} reqMethodName - name of the BACnet service
    * @return {Bluebird<any>}
    */
OutputSocket.prototype.send = function (msg, reqMethodName) {
    this.seqManager.next(this.config.rinfo.address + ":" + this.config.rinfo.port, {
        object: this,
        method: this._send,
        params: [msg, reqMethodName],
    });
};
/**
    * Sends the message by broadcast channel.
    *
    * @param  {Buffer} msg - message (bytes)
    * @param  {string} reqMethodName - name of the BACnet service
    * @return {Bluebird<any>}
    */
OutputSocket.prototype._sendBroadcast = function (msg, reqMethodName) {
    var _this = this;
    this.socket.setBroadcast(true);
    var bcAddress = BroadcastAddress;
    var bcPort = this.config.rinfo.port;
    this.logSendMethods(bcAddress, bcPort, msg, 'sendBroadcast', reqMethodName);
    return new Bluebird(function (resolve, reject) {
        _this.socket.send(msg, 0, msg.length, bcPort, bcAddress, function (error, data) {
            _this.socket.setBroadcast(false);
            if (error) {
                return reject(error);
            }
            resolve(data);
        });
    });
};
/**
    * Sends the message by broadcast channel.
    *
    * @param  {Buffer} msg - message (bytes)
    * @param  {string} reqMethodName - name of the BACnet service
    * @return {Bluebird<any>}
    */
OutputSocket.prototype.sendBroadcast = function (msg, reqMethodName) {
    this.seqManager.next(BroadcastAddress + ":" + this.config.rinfo.port, {
        object: this,
        method: this._sendBroadcast,
        params: [msg, reqMethodName],
    });
};
/**
    * Logs the "send" methods.
    *
    * @param  {string} address - address of the BACnet device
    * @param  {number} port - port of the BACnet device
    * @param  {Buffer} msg - message (bytes)
    * @param  {string} sendMethodName - name of "send" method
    * @param  {string} reqMethodName - name of the BACnet service
    * @return {void}
    */
OutputSocket.prototype.logSendMethods = function (address, port, msg, sendMethodName, reqMethodName) {
    try {
        this.logger.logDebug(this.className + " - " + sendMethodName + " (" + address + ":" + port + "): "
            + (reqMethodName + " - " + msg.toString('hex')));
    }
    catch (error) {
        this.logger.logDebug(this.className + " - " + sendMethodName + " (" + address + ":" + port + "): " + error);
    }
};
/**
    * Returns the address and port of the BACnet device.
    *
    * @return {IBACnetAddressInfo}
    */
OutputSocket.prototype.getAddressInfo = function () {
    return _.cloneDeep(this.config.rinfo);
};

module.exports = OutputSocket;
