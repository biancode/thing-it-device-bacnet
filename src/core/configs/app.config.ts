import { IAppConfig } from '../interfaces';

export const AppConfig: IAppConfig = {
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
