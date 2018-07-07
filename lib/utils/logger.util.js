"use strict";

var Enums = require("../enums");
var Map = require('es6-map');
function Logger(tidDevice) {
    this.tidDevice = tidDevice;
    this.loggerMethods = new Map();
    this.tidDevice.logLevel = 'debug';
}
/**
 * Sets the method name of the logger.
 *
 * @param  {Enums.LogLevel} methodName - name of the logger method
 * @param  {any} method - logger method
 * @return {void}
 */
Logger.prototype.setLogMethod = function (methodName, method) {
    this.loggerMethods.set(methodName, method);
};
/**
 * Shows the log message with `Info` priority.
 *
 * @param  {...any} messages - log messages
 * @return {void}
 */
Logger.prototype.logInfo = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    this.log.apply(this, [Enums.LogLevel.Info].concat(messages));
};
/**
 * Shows the log message with `Debug` priority.
 *
 * @param  {...any} messages - log messages
 * @return {void}
 */
Logger.prototype.logDebug = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    this.log.apply(this, [Enums.LogLevel.Debug].concat(messages));
};
/**
 * Shows the log message with `Error` priority.
 *
 * @param  {...any} messages - log messages
 * @return {void}
 */
Logger.prototype.logError = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    this.log.apply(this, [Enums.LogLevel.Error].concat(messages));
};
/**
 * Shows the log message with specific priority.
 *
 * @param  {Enums.LogLevel} methodName - name of the logger method
 * @param  {...any} messages - log messages
 * @return {void}
 */
Logger.prototype.log = function (methodName) {
    var messages = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        messages[_i - 1] = arguments[_i];
    }
    var loggerMethod = this.loggerMethods.get(methodName);
    loggerMethod.apply(this.tidDevice, messages);
};

module.exports = Logger;
