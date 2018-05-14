import * as Bluebird from 'bluebird';
import * as assert from 'assert';

import * as TestDriver from 'thing-it-test';

function wait (delay, fn?: () => any) {
    return new Bluebird((resolve, reject) => setTimeout(() => {
        fn && fn();
        resolve();
    }, delay));
}

describe('[thing-it] Disruptive Technologies Device', () => {
    let testDriver;

    const time = {
        test1: 15000,
    }

    before(() => {
        testDriver = TestDriver.createTestDriver({ logLevel: 'debug' });
        testDriver.registerDevicePlugin('bacnet', __dirname + '/../bacnet-device.controller');
        testDriver.registerUnitPlugin(__dirname + '/../default-units/binary-input.actor');
        testDriver.start({
            configuration: require('../examples/configuration.js'),
            heartbeat: 10,
        });
    });

    after(() => {
        testDriver.stop();
    });

    it('should have completed initialization successfully', async () => {
        await wait(time.test1);
    }).timeout(time.test1 + 2000);
});
