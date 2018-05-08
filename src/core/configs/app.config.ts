import * as Interfaces from '../interfaces';
import { AppUtil } from '../utils';

export const AppConfig: Interfaces.AppConfig = {
    response: {
        iAm: {
            timeout: 30000,
        },
        readProperty: {
            timeout: 30000,
        },
    },
    manager: {
        flow: {},
        service: {
            covTimer: {
                lifetime: AppUtil.timeToMs(5, 'minute'),
                period: AppUtil.timeToMs(2.3, 'minute'),
            },
            dest: {
                address: '',
                port: 47808,
            },
        },
    },
    server: {
        port: 47808,
        sequence: {
            thread: 1,
            delay: 20,
        },
    },
};
