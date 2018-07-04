import { OutputSocket } from '../../sockets';

import { Logger } from '../../utils';

import * as BACnet from 'tid-bacnet-logic';

export class APIConfirmedReqService {

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
     * readProperty - sends "Confirmed ReadProperty" request using the udp sockets.
     *
     * @param  {IServiceConfirmedReqReadPropertyype} opts - request options
     * @return {void}
     */
    public readProperty (opts: BACnet.Interfaces.ConfirmedRequest.Service.ReadProperty): void {
        const message = BACnet.Services.ConfirmedReqService.readProperty(opts);
        this.socket.send(message, 'readProperty');
    }

    /**
     * writeProperty - sends "Confirmed WriteProperty" request using the udp sockets.
     *
     * @param  {IServiceConfirmedReqWriteProperty} opts - request options
     * @return {void}
     */
    public writeProperty (opts: BACnet.Interfaces.ConfirmedRequest.Service.WriteProperty): void {
        const message = BACnet.Services.ConfirmedReqService.writeProperty(opts);
        this.socket.sendBroadcast(message, 'writeProperty');
    }

    /**
     * subscribeCOV - sends "Confirmed SubscribeCOV" request to subscribe/resubscribe
     * to CoV using the udp sockets.
     *
     * @param  {IServiceConfirmedReqSubscribeCOV} opts - request options
     * @return {void}
     */
    public subscribeCOV (opts: BACnet.Interfaces.ConfirmedRequest.Service.SubscribeCOV): void {
        const message = BACnet.Services.ConfirmedReqService.subscribeCOV(opts);
        this.socket.send(message, 'subscribeCOV');
    }

    /**
     * subscribeCOV - sends "Confirmed SubscribeCOV" request to cancel CoV subsciption
     * using the udp sockets.
     *
     * @param  {IServiceConfirmedReqUnsubscribeCOV} opts - request options
     * @return {void}
     */
    public unsubscribeCOV (opts: BACnet.Interfaces.ConfirmedRequest.Service.UnsubscribeCOV): void {
        const message = BACnet.Services.ConfirmedReqService.unsubscribeCOV(opts);
        this.socket.send(message, 'unsubscribeCOV');
    }
}
