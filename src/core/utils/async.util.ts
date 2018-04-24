import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';

import { ApiError } from '../errors';

export class AsyncUtil {

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
    static setTimeout (timeout: number, callback?: () => any): Bluebird<any> {
        return new Bluebird((resolve, reject) => {
            setTimeout(() => { resolve(null); }, timeout);
            _.isFunction(callback) && callback();
        });
    }

    /**
     * readFile - asynchronously reads the entire contents of a file.
     *
     * @static
     * @param  {string} filePath - filename
     * @return {Bluebird<any>}
     */
    static readFile (filePath: string): Bluebird<Buffer> {
        return new Bluebird((resolve, reject) => {
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    throw new ApiError(`EDEStorageManager - readFile: ${error}`);
                }
                resolve(data);
            });
        });
    }

    /**
     * moveFile - asynchronously move file at oldPath to the pathname provided
     * as newPath.
     *
     * @static
     * @param  {string} oldPath - path to old file
     * @param  {string} newPath - path to new file
     * @return {Bluebird<any>}
     */
    static moveFile (oldPath: string, newPath: string): Bluebird<any> {
        return new Bluebird((resolve, reject) => {
            fs.rename(oldPath, newPath, (error) => {
                if (!error) {
                    return resolve();
                }
                if (error.code === 'EXDEV') {
                    AsyncUtil.copyFile(oldPath, newPath);
                }
                throw new ApiError(`AsyncUtil - moveFile: ${error}`);
            });
        });
    }

    /**
     * moveFile - asynchronously copy file at oldPath to the pathname provided
     * as newPath.
     *
     * @static
     * @param  {string} oldPath - path to old file
     * @param  {string} newPath - path to new file
     * @return {Bluebird<any>}
     */
    static copyFile (oldPath: string, newPath: string): Bluebird<any> {
        return new Bluebird((resolve, reject) => {
            const readStream = fs.createReadStream(oldPath);
            const writeStream = fs.createWriteStream(newPath);

            readStream.on('error', (error) => {
                throw new ApiError(`AsyncUtil - copyFile: ${error}`);
            });
            writeStream.on('error', (error) => {
                throw new ApiError(`AsyncUtil - copyFile: ${error}`);
            });

            readStream.on('close', () => {
                fs.unlink(oldPath, () => {
                    resolve();
                });
            });

            readStream.pipe(writeStream);
        });
    }
}
