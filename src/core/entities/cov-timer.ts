import * as moment from 'moment';
import { Moment } from 'moment';

import * as Interfaces from '../interfaces';

export class COVTimer {
    public config: Interfaces.COVTimer.Config;

    public prev: Moment;
    public next: Moment;

    public init (config: Interfaces.COVTimer.Config) {
        this.config = config;
        this.prev = moment();
        this.next = this.prev.clone().add(config.period, 'ms');
    }
}
