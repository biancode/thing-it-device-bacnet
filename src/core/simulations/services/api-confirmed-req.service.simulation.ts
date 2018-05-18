import * as Rx from 'rxjs';
import * as BACnet from 'bacnet-logic';

import { Logger } from '../../utils';

import * as Interfaces from '../../interfaces';

import * as Enums from '../../enums';

export class APIConfirmedReqService {

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
     * readProperty - sends "Confirmed ReadProperty" request using the udp sockets.
     *
     * @param  {IServiceConfirmedReqReadPropertyype} opts - request options
     * @return {void}
     */
    public readProperty (opts: BACnet.Interfaces.ConfirmedRequest.Service.ReadProperty): void {
        this.socket.next({
            type: Enums.Simulation.ConfirmedRequestService.ReadProperty,
            params: opts,
        });
    }

    /**
     * writeProperty - sends "Confirmed WriteProperty" request using the udp sockets.
     *
     * @param  {IServiceConfirmedReqWriteProperty} opts - request options
     * @return {void}
     */
    public writeProperty (opts: BACnet.Interfaces.ConfirmedRequest.Service.WriteProperty): void {
        this.socket.next({
            type: Enums.Simulation.ConfirmedRequestService.WriteProperty,
            params: opts,
        });
    }

    /**
     * subscribeCOV - sends "Confirmed SubscribeCOV" request to subscribe/resubscribe
     * to CoV using the udp sockets.
     *
     * @param  {IServiceConfirmedReqSubscribeCOV} opts - request options
     * @return {void}
     */
    public subscribeCOV (opts: BACnet.Interfaces.ConfirmedRequest.Service.SubscribeCOV): void {
        this.socket.next({
            type: Enums.Simulation.ConfirmedRequestService.SubscribeCOV,
            params: opts,
        });
    }

    /**
     * subscribeCOV - sends "Confirmed SubscribeCOV" request to cancel CoV subsciption
     * using the udp sockets.
     *
     * @param  {IServiceConfirmedReqUnsubscribeCOV} opts - request options
     * @return {void}
     */
    public unsubscribeCOV (opts: BACnet.Interfaces.ConfirmedRequest.Service.UnsubscribeCOV): void {
        this.socket.next({
            type: Enums.Simulation.ConfirmedRequestService.UnsubscribeCOV,
            params: opts,
        });
    }
}
