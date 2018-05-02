import * as dgram from 'dgram';

import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

import { Subject } from 'rxjs';

import {
    IServerSocketConfig,
    IServerSocketResponse,
    IBACnetAddressInfo,
} from '../interfaces';

import { ApiError } from '../errors';
import { Logger } from '../utils';

import { OutputSocket } from './output.socket';

import { SequenceManager } from '../managers';

export class ServerSocket {
    public readonly className: string = 'Server';

    private sock: dgram.Socket;

    private serverConfig: IServerSocketConfig;

    private sequenceManager: SequenceManager;

    private _respFlow: Subject<IServerSocketResponse>;
    public get respFlow (): Subject<IServerSocketResponse> {
        return this._respFlow;
    }

    constructor (private logger: Logger) {
    }

    public initServer (serverConfig: IServerSocketConfig): void {
        // Save configuration
        this.serverConfig = serverConfig;
        // Create response flow
        this._respFlow = new Subject();
        // Create sequence manager
        this.sequenceManager = new SequenceManager(this.serverConfig.sequence);
    }

    /**
     * destroy - destroys the socket connection.
     *
     * @return {Bluebird<any>}
     */
    public destroy (): Bluebird<any> {
        this._respFlow.complete();
        this._respFlow = null;

        return new Bluebird((resolve, reject) => {
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

        this.sock.on('message', (msg: Buffer, rinfo: dgram.AddressInfo) => {
            // Generate Output Socket
            const outputSoc = this.getOutputSocket({
                port: rinfo.port, address: rinfo.address,
            });

            this._respFlow.next({ message: msg, socket: outputSoc });
        });

        const startPromise = new Bluebird((resolve, reject) => {
            this.sock.on('listening', () => {
                const addrInfo = this.sock.address();
                this.logger.logInfo(`${this.className} - startServer: `
                    + `DEBUG bacNetAdapter: UDP Server listening on ${addrInfo.address}:${addrInfo.port}`);
                resolve(addrInfo);
            });
        })

        if (!this.serverConfig.port) {
            throw new ApiError(`${this.className} - startServer: Port is required!`);
        }

        this.sock.bind(this.serverConfig.port);

        return startPromise;
    }

    /**
     * genOutputSocket - generates and returns the instance of OutputSocket.
     *
     * @param  {IBACnetAddressInfo} rinfo - object with endpoint address and port
     * @return {OutputSocket}
     */
    public getOutputSocket (rinfo: IBACnetAddressInfo): OutputSocket {
        return new OutputSocket(this.sock, rinfo, this.sequenceManager);
    }
}
