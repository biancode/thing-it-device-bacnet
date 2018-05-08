import * as moment from 'moment';
import { Moment } from 'moment';

import * as Interfaces from '../interfaces';

export class COVTimer {
    public config: Interfaces.COVTimer.Config;

    public prev: Moment;
    public next: Moment;

    /**
     * Inits the COVTimer entity.
     *
     * @param  {Interfaces.COVTimer.Config} config - entity configuration
     * @return {void}
     */
    public init (config: Interfaces.COVTimer.Config): void {
        this.config = config;
        this.prev = moment();
        this.next = this.prev.clone().add(config.period, 'ms');
    }

    /**
     * Returns JS representation of the COVTimer entity
     *
     * @return {Interfaces.COVTimer.Data}
     */
    public valueOf(): Interfaces.COVTimer.Data {
        return { prev: this.prev, next: this.next };
    }
}
