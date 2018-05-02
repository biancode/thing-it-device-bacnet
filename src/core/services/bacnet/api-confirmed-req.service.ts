import { OutputSocket } from '../../sockets';

import { ConfirmedReqService } from '../../bacnet/services';

import {
    IServiceConfirmedReqReadProperty,
    IServiceConfirmedReqWriteProperty,
    IServiceConfirmedReqSubscribeCOV,
    IServiceConfirmedReqUnsubscribeCOV,
} from '../../bacnet/interfaces';

export class APIConfirmedReqService {

    constructor (private socket: OutputSocket) {}

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
    public readProperty (opts: IServiceConfirmedReqReadProperty): void {
        const message = ConfirmedReqService.readProperty(opts);
        this.socket.send(message, 'readProperty');
    }

    /**
     * writeProperty - sends "Confirmed WriteProperty" request using the udp sockets.
     *
     * @param  {IServiceConfirmedReqWriteProperty} opts - request options
     * @return {void}
     */
    public writeProperty (opts: IServiceConfirmedReqWriteProperty): void {
        const message = ConfirmedReqService.writeProperty(opts);
        this.socket.sendBroadcast(message, 'writeProperty');
    }

    /**
     * subscribeCOV - sends "Confirmed SubscribeCOV" request to subscribe/resubscribe
     * to CoV using the udp sockets.
     *
     * @param  {IServiceConfirmedReqSubscribeCOV} opts - request options
     * @return {void}
     */
    public subscribeCOV (opts: IServiceConfirmedReqSubscribeCOV): void {
        const message = ConfirmedReqService.subscribeCOV(opts);
        this.socket.sendBroadcast(message, 'subscribeCOV');
    }

    /**
     * subscribeCOV - sends "Confirmed SubscribeCOV" request to cancel CoV subsciption
     * using the udp sockets.
     *
     * @param  {IServiceConfirmedReqUnsubscribeCOV} opts - request options
     * @return {void}
     */
    public unsubscribeCOV (opts: IServiceConfirmedReqUnsubscribeCOV): void {
        const message = ConfirmedReqService.unsubscribeCOV(opts);
        this.socket.sendBroadcast(message, 'unsubscribeCOV');
    }
}
