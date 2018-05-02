import { OutputSocket } from '../../sockets';

import { Logger } from '../../utils';

import { UnconfirmedReqService } from '../../bacnet/services';

import {
    IServiceUnconfirmedReqWhoIs,
} from '../../bacnet/interfaces';

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
    public whoIs (opts: IServiceUnconfirmedReqWhoIs): void {
        const message = UnconfirmedReqService.whoIs(opts);
        this.socket.sendBroadcast(message, 'whoIs');
    }
}
