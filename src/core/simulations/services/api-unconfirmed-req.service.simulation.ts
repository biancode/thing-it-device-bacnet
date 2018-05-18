import * as Rx from 'rxjs';
import * as BACnet from 'bacnet-logic';

import { Logger } from '../../utils';

import * as Interfaces from '../../interfaces';

import * as Enums from '../../enums';

export class APIUnconfirmedReqService {

    constructor (private logger: Logger,
        private socket: Rx.Subject<Interfaces.Simulation.APINotification>) {}

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
        this.socket.next({
            type: Enums.Simulation.UnsonfirmedRequestService.WhoIsBroadcast,
            params: opts,
        });
    }

    /**
     * whoIs - sends "Unconfirmed WhoIs" request using the udp sockets.
     *
     * @param  {IServiceUnconfirmedReqWhoIs} opts - request options
     * @return {void}
     */
    public whoIsUnicast (opts: BACnet.Interfaces.UnconfirmedRequest.Service.WhoIs): void {
        this.socket.next({
            type: Enums.Simulation.UnsonfirmedRequestService.WhoIsUnicast,
            params: opts,
        });
    }
}
