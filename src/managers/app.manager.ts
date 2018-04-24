import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { argv } from 'yargs';

import { Server } from '../core/sockets';

import { mainRouter } from '../routes';

import {
    ApiError,
} from '../core/errors';

import {
    IAppConfig,
} from '../core/interfaces';

import {
    logger,
    AsyncUtil,
    EDEReaderUtil,
} from '../core/utils';

import { UnitStorageManager } from './unit-storage.manager';

export class AppManager {
    private server: Server;

    constructor (private appConfig: IAppConfig) {
        this.handleArgs();
        this.server = new Server(this.appConfig.server, mainRouter);
    }

    public handleArgs () {
        if (!_.isString(argv.filePath) || !argv.filePath) {
            throw new ApiError('AppManager - handleArgs: Path to the EDE file is required!');
        }
        if (!path.isAbsolute(argv.filePath)) {
            throw new ApiError('AppManager - handleArgs: Path to the EDE file must be absolute!');
        }
        this.appConfig.bacnet.edeFilePath = argv.filePath;

        if (argv.port) {
            this.appConfig.server.port = argv.port;
        }

        if (argv.reqDelay) {
            this.appConfig.server.outputSequence.delay = +argv.reqDelay;
        }

        if (argv.reqThread) {
            this.appConfig.server.outputSequence.thread = +argv.reqThread;
        }
    }

    public start () {
        return Bluebird.resolve()
            .then(() => AsyncUtil.readFile(this.appConfig.bacnet.edeFilePath))
            .then((fileData) => {
                const edeReader = new EDEReaderUtil(fileData);
                const edeDataPoint = edeReader.readDataPointTable();

                const unitStorageManager = new UnitStorageManager();
                unitStorageManager.initUnits(edeDataPoint);

                this.server.registerService('unitStorage', unitStorageManager);
            })
            .then(() => this.server.startServer());
    }
}
