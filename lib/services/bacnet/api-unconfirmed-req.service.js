"use strict";
var BACnet = require("tid-bacnet-logic");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;

function APIUnconfirmedReqService(logger, socket) {
    this.logger = logger;
    this.socket = socket;
}
/**
 * Destroys the instance.
 * - removes socket (sets `null`)
 *
 * @return {Promise<any>}
 */
APIUnconfirmedReqService.prototype.destroy = function () {

    this.socket = null;
    return Bluebird.resolve();

};
/**
 * whoIs - sends "Unconfirmed WhoIs" request using the udp sockets.
 *
 * @param  {IServiceUnconfirmedReqWhoIs} opts - request options
 * @return {void}
 */
APIUnconfirmedReqService.prototype.whoIsBroadcast = function (opts) {
    var message = BACnet.Services.UnconfirmedReqService.whoIs(opts);
    this.socket.sendBroadcast(message, 'whoIsBroadcast');
};
/**
 * whoIs - sends "Unconfirmed WhoIs" request using the udp sockets.
 *
 * @param  {IServiceUnconfirmedReqWhoIs} opts - request options
 * @return {void}
 */
APIUnconfirmedReqService.prototype.whoIsUnicast = function (opts) {
    var message = BACnet.Services.UnconfirmedReqService.whoIs(opts);
    this.socket.send(message, 'whoIsUnicast');
};

module.exports = APIUnconfirmedReqService;
