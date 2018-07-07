"use strict";

var BACnet = require("tid-bacnet-logic");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;

function APIConfirmedReqService(logger, socket) {
    this.logger = logger;
    this.socket = socket;
}
/**
 * Destroys the instance.
 * - removes socket (sets `null`)
 *
 * @return {Promise<any>}
 */
APIConfirmedReqService.prototype.destroy = function () {

    this.socket = null;
    return Bluebird.resolve();

};
/**
 * readProperty - sends "Confirmed ReadProperty" request using the udp sockets.
 *
 * @param  {IServiceConfirmedReqReadPropertyype} opts - request options
 * @return {void}
 */
APIConfirmedReqService.prototype.readProperty = function (opts) {
    var message = BACnet.Services.ConfirmedReqService.readProperty(opts);
    this.socket.send(message, 'readProperty');
};
/**
 * writeProperty - sends "Confirmed WriteProperty" request using the udp sockets.
 *
 * @param  {IServiceConfirmedReqWriteProperty} opts - request options
 * @return {void}
 */
APIConfirmedReqService.prototype.writeProperty = function (opts) {
    var message = BACnet.Services.ConfirmedReqService.writeProperty(opts);
    this.socket.sendBroadcast(message, 'writeProperty');
};
/**
 * subscribeCOV - sends "Confirmed SubscribeCOV" request to subscribe/resubscribe
 * to CoV using the udp sockets.
 *
 * @param  {IServiceConfirmedReqSubscribeCOV} opts - request options
 * @return {void}
 */
APIConfirmedReqService.prototype.subscribeCOV = function (opts) {
    var message = BACnet.Services.ConfirmedReqService.subscribeCOV(opts);
    this.socket.send(message, 'subscribeCOV');
};
/**
 * subscribeCOV - sends "Confirmed SubscribeCOV" request to cancel CoV subsciption
 * using the udp sockets.
 *
 * @param  {IServiceConfirmedReqUnsubscribeCOV} opts - request options
 * @return {void}
 */
APIConfirmedReqService.prototype.unsubscribeCOV = function (opts) {
    var message = BACnet.Services.ConfirmedReqService.unsubscribeCOV(opts);
    this.socket.send(message, 'unsubscribeCOV');
};

module.exports = APIConfirmedReqService;
