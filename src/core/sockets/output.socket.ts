import { Socket } from 'dgram';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import * as Interfaces from '../interfaces';

import { SequenceManager } from '../managers';
import { Logger } from '../utils';

const BroadcastAddress: string = `255.255.255.255`;

export class OutputSocket {
    public readonly className: string = 'OutputSocket';
    private config: Interfaces.ServerSocket.Request;

    constructor (private logger: Logger,
        private socket: Socket,
        private seqManager: SequenceManager) {
    }

    /**
     * Initializes the `output` socket.
     * - sets configuration
     *
     * @param  {Interfaces.ServerSocket.Request} config - configuration of the `output` socket
     * @return {Promise<void>}
     */
    public initialize (config: Interfaces.ServerSocket.Request): void {
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
        const ucAddress = this.config.rinfo.address;
        const ucPort = this.config.rinfo.port;

        this.logSendMethods(ucAddress, ucPort, msg, 'send', reqMethodName);
        return new Bluebird((resolve, reject) => {
            this.socket.send(msg, 0, msg.length, ucPort, ucAddress, (error, data) => {
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }

    /**
     * Sends the message by unicast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    public send (msg: Buffer, reqMethodName: string): void {
        this.seqManager.next(`${this.config.rinfo.address}:${this.config.rinfo.port}`, {
            object: this,
            method: this._send,
            params: [msg, reqMethodName],
        });
    }

    /**
     * Sends the message by broadcast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    public _sendBroadcast (msg: Buffer, reqMethodName: string): Bluebird<any> {
        this.socket.setBroadcast(true);
        const bcAddress = BroadcastAddress;
        const bcPort = this.config.rinfo.port;

        this.logSendMethods(bcAddress, bcPort, msg, 'sendBroadcast', reqMethodName);
        return new Bluebird((resolve, reject) => {
            this.socket.send(msg, 0, msg.length, bcPort, bcAddress, (error, data) => {
                this.socket.setBroadcast(false);
                if (error) {
                    return reject(error);
                }
                resolve(data);
            });
        });
    }

    /**
     * Sends the message by broadcast channel.
     *
     * @param  {Buffer} msg - message (bytes)
     * @param  {string} reqMethodName - name of the BACnet service
     * @return {Bluebird<any>}
     */
    public sendBroadcast (msg: Buffer, reqMethodName: string): void {
        this.seqManager.next(`${BroadcastAddress}:${this.config.rinfo.port}`, {
            object: this,
            method: this._sendBroadcast,
            params: [msg, reqMethodName],
        });
    }

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
    private logSendMethods (address: string, port: number, msg: Buffer,
            sendMethodName: string, reqMethodName: string): void {
        try {
            this.logger.logDebug(`${this.className} - ${sendMethodName} (${address}:${port}): `
                + `${reqMethodName} - ${msg.toString('hex')}`);
        } catch (error) {
            this.logger.logDebug(`${this.className} - ${sendMethodName} (${address}:${port}): ${error}`);
        }
    }

    /**
     * Returns the address and port of the BACnet device.
     *
     * @return {IBACnetAddressInfo}
     */
    public getAddressInfo (): Interfaces.ServerSocket.AddressInfo {
        return _.cloneDeep(this.config.rinfo);
    }
}
