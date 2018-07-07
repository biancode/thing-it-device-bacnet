"use strict";
var Bluebird = require("bluebird");
var _ = require("lodash");
var fs = require("fs");
var Errors = require("../errors");

function AsyncUtil() {
}
/**
 * setTimeout - sets a timer which executes a function or specified piece
 * of code once after the timer expires.
 *
 * @static
 * @param  {number} timeout - time, in milliseconds (thousandths of a second),
 * the timer should wait before the specified function or code is executed
 * @param  {function} [callback] - function to be executed after the timer expires
 * @return {Bluebird<any>}
 */
AsyncUtil.setTimeout = function (timeout, callback) {
    return new Bluebird(function (resolve, reject) {
        setTimeout(function () { resolve(null); }, timeout);
        _.isFunction(callback) && callback();
    });
};
/**
 * readFile - asynchronously reads the entire contents of a file.
 *
 * @static
 * @param  {string} filePath - filename
 * @return {Bluebird<any>}
 */
AsyncUtil.readFile = function (filePath) {
    return new Bluebird(function (resolve, reject) {
        fs.readFile(filePath, function (error, data) {
            if (error) {
                throw new Errors.APIError("EDEStorageManager - readFile: " + error);
            }
            resolve(data);
        });
    });
};
/**
 * moveFile - asynchronously move file at oldPath to the pathname provided
 * as newPath.
 *
 * @static
 * @param  {string} oldPath - path to old file
 * @param  {string} newPath - path to new file
 * @return {Bluebird<any>}
 */
AsyncUtil.moveFile = function (oldPath, newPath) {
    return new Bluebird(function (resolve, reject) {
        fs.rename(oldPath, newPath, function (error) {
            if (!error) {
                return resolve();
            }
            if (error.code === 'EXDEV') {
                AsyncUtil.copyFile(oldPath, newPath);
            }
            throw new Errors.APIError("AsyncUtil - moveFile: " + error);
        });
    });
};
/**
 * moveFile - asynchronously copy file at oldPath to the pathname provided
 * as newPath.
 *
 * @static
 * @param  {string} oldPath - path to old file
 * @param  {string} newPath - path to new file
 * @return {Bluebird<any>}
 */
AsyncUtil.copyFile = function (oldPath, newPath) {
    return new Bluebird(function (resolve, reject) {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);
        readStream.on('error', function (error) {
            throw new Errors.APIError("AsyncUtil - copyFile: " + error);
        });
        writeStream.on('error', function (error) {
            throw new Errors.APIError("AsyncUtil - copyFile: " + error);
        });
        readStream.on('close', function () {
            fs.unlink(oldPath, function () {
                resolve();
            });
        });
        readStream.pipe(writeStream);
    });
};

module.exports = AsyncUtil;
