import { OutputSocket } from '../../sockets';

import { Logger } from '../../utils';

import * as BACnet from 'bacnet-logic';

export class APIUnconfirmedReqService {
    constructor (private logger: Logger,
        private socket: OutputSocket) {}

    /**
     * Destroys the instance.
     * - removes socket (sets `null`)
     *
     * @return {Promise<any>}
     */
    public async destroy (): Promise<any> {
        this.socket = null;
    }

    /**
     * whoIs - sends "Unconfirmed WhoIs" request using the udp sockets.
     *
     * @param  {IServiceUnconfirmedReqWhoIs} opts - request options
     * @return {void}
     */
    public whoIsBroadcast (opts: BACnet.Interfaces.UnconfirmedRequest.Service.WhoIs): void {
        const message = BACnet.Services.UnconfirmedReqService.whoIs(opts);
        this.socket.sendBroadcast(message, 'whoIsBroadcast');
    }

    /**
     * whoIs - sends "Unconfirmed WhoIs" request using the udp sockets.
     *
     * @param  {IServiceUnconfirmedReqWhoIs} opts - request options
     * @return {void}
     */
    public whoIsUnicast (opts: BACnet.Interfaces.UnconfirmedRequest.Service.WhoIs): void {
        const message = BACnet.Services.UnconfirmedReqService.whoIs(opts);
        this.socket.send(message, 'whoIsUnicast');
    }
}
