import * as dgram from 'dgram';

import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

import { Subject } from 'rxjs';

import * as Interfaces from '../interfaces';

import { APIError } from '../errors';
import { Logger } from '../utils';

import { OutputSocket } from './output.socket';

import { SequenceManager } from '../managers';

export class ServerSocket {
    public readonly className: string = 'Server';

    private sock: dgram.Socket;

    private config: Interfaces.ServerSocket.Config;

    private sequenceManager: SequenceManager;

    private _respFlow: Subject<Interfaces.ServerSocket.Response>;
    public get respFlow (): Subject<Interfaces.ServerSocket.Response> {
        return this._respFlow;
    }

    constructor (private logger: Logger) {
    }

    public initServer (config: Interfaces.ServerSocket.Config): void {
        // Save configuration
        this.config = config;
        // Create response flow
        this._respFlow = new Subject();
        // Create sequence manager
        this.sequenceManager = new SequenceManager();
        this.sequenceManager.initManager(this.config.sequence);
    }

    /**
     * destroy - destroys the socket connection.
     *
     * @return {Bluebird<any>}
     */
    public async destroy (): Promise<any> {
        this._respFlow.unsubscribe();
        this._respFlow = null;

        await this.sequenceManager.destroy();

        await new Bluebird((resolve, reject) => {
            this.sock.close(() => { resolve(); });
        });
    }

    /**
     * startServer - starts the server.
     *
     * @return {void}
     */
    public startServer () {
        this.sock = dgram.createSocket('udp4');

        this.sock.on('error', (error) => {
            this.logger.logError(`${this.className} - startServer: UDP Error - ${error}`);
        });

        this.sock.on('message', (msg: Buffer, rinfo: Interfaces.ServerSocket.AddressInfo) => {
            // Generate Output Socket
            const outputSoc = this.getOutputSocket({
                port: rinfo.port, address: rinfo.address,
            });

            this._respFlow.next({ message: msg, socket: outputSoc });
        });

        const startPromise = new Bluebird((resolve, reject) => {
            this.sock.on('listening', () => {
                const addrInfo = this.sock.address() as Interfaces.ServerSocket.AddressInfo;
                this.logger.logInfo(`${this.className} - startServer: `
                    + `UDP Server listening on ${addrInfo.address}:${addrInfo.port}`);
                resolve(addrInfo);
            });
        })

        if (!this.config.port) {
            throw new APIError(`${this.className} - startServer: Port is required!`);
        }

        this.sock.bind(this.config.port);

        return startPromise;
    }

    /**
     * genOutputSocket - creates the instance of `Output` socket.
     *
     * @param  {IBACnetAddressInfo} rinfo - object with endpoint address and port
     * @param  {Logger} [logger] - instance of the `Logger`
     * @return {OutputSocket}
     */
    public getOutputSocket (rinfo: Interfaces.ServerSocket.AddressInfo, logger?: Logger): OutputSocket {
        const apiLogger = _.isNil(logger) ? this.logger : logger;

        const outputSocket = new OutputSocket(apiLogger, this.sock, this.sequenceManager);
        outputSocket.initialize({ rinfo: rinfo });

        return outputSocket;
    }
}
