import * as dgram from 'dgram';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { logger } from '../utils';

import { IBACnetAddressInfo } from '../interfaces';

import { SequenceManager } from '../managers';

export class OutputSocket {
    public readonly className: string = 'OutputSocket';

    constructor (private app: dgram.Socket,
        private rinfo: IBACnetAddressInfo,
        private seqManager: SequenceManager) {
    }

    /**
     * Initializes the `output` socket.
     * - sets configuration
     *
     * @param  {IOutputSocketConfig} config - configuration of the `output` socket
     * @return {Promise<void>}
     */
    public initialize (config: IOutputSocketConfig): void {
        this.config = config;
    }

    /**
     * Destroys the instance of the `output` socket.
     * - removes config (sets `null`)
     * - removes socket (sets `null`)
     * - removes seqManager (sets `null`)
     * - removes logger (sets `null`)
     *
     * @return {Promise<void>}
     */
    public destroy (): void {
        this.config = null;
        this.socket = null;
        this.seqManager = null;
        this.logger = null;
    }

    /**
     * Sends the message by unicast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    private _send (msg: Buffer, reqMethodName: string): Bluebird<any> {
        const ucAddress = this.rinfo.address;
        const ucPort = this.rinfo.port;

        this.logSendMethods(ucAddress, ucPort, msg, 'send', reqMethodName);
        return new Bluebird((resolve, reject) => {
            this.app.send(msg, 0, msg.length, ucPort, ucAddress, (error, data) => {
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }

    /**
     * send - sends the message by unicast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    public send (msg: Buffer, reqMethodName: string): void {
        this.seqManager.next({
            id: `${this.rinfo.address}:${this.rinfo.port}`,
            object: this,
            method: this._send,
            params: [msg, reqMethodName],
        });
    }

    /**
     * sendBroadcast - sends the message by broadcast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    public _sendBroadcast (msg: Buffer, reqMethodName: string): Bluebird<any> {
        this.app.setBroadcast(true);
        const bcAddress = `255.255.255.255`;
        const bcPort = this.rinfo.port;

        this.logSendMethods(bcAddress, bcPort, msg, 'sendBroadcast', reqMethodName);
        return new Bluebird((resolve, reject) => {
            this.app.send(msg, 0, msg.length, bcPort, bcAddress, (error, data) => {
                this.app.setBroadcast(false);
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }

    /**
     * sendBroadcast - sends the message by broadcast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    public sendBroadcast (msg: Buffer, reqMethodName: string): void {
        this.seqManager.next({
            id: `${this.rinfo.address}:${this.rinfo.port}`,
            object: this,
            method: this._sendBroadcast,
            params: [msg, reqMethodName],
        });
    }

    /**
     * logSendMethods - logs the "send" methods.
     *
     * @param  {string} address - address of the BACnet device
     * @param  {number} port - port of the BACnet device
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} sendMethodName - name of "send" method
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {void}
     */
    private logSendMethods (address: string, port: number, msg: Buffer,
            sendMethodName: string, reqMethodName: string): void {
        try {
            logger.debug(`${this.className} - ${sendMethodName} (${address}:${port}): ${reqMethodName}`);
            logger.debug(`${this.className} - ${sendMethodName} (${address}:${port}): ${msg.toString('hex')}`);
        } catch (error) {
            logger.error(`${this.className} - ${sendMethodName} (${address}:${port}): ${error}`);
        }
    }

    /**
     * getAddressInfo - returns the address and port of the BACnet device.
     *
     * @return {IBACnetAddressInfo}
     */
    public getAddressInfo (): IBACnetAddressInfo {
        return _.cloneDeep(this.rinfo);
    }
}
