import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { Alias } from './alias';

describe('Alias', () => {
    describe('constructor', () => {
        it('should create unique identifier for each alias', () => {
            const alias1 = new Alias();
            expect(alias1.id).to.not.null;

            const alias2 = new Alias();
            expect(alias2.id).to.not.null;

            expect(alias1.id).to.not.equal(alias2.id);
        });

        it('should create empty alias store if argument is not provided', () => {
            const alias = new Alias();
            expect(alias['aliases'].size).to.equal(0);
        });

        it('should create alias store with elements if argument is provided', () => {
            const alias = new Alias([ 'default', 'hello' ]);
            expect(alias['aliases'].size).to.equal(2);
        });
    });

    describe('destroy', () => {
        it('should destroy alias identifier', () => {
            const alias = new Alias();

            expect(alias.id).to.not.be.null;

            alias.destroy();

            expect(alias.id).to.be.null;
        });

        it('should destroy alias storage if alias storage is empty', () => {
            const alias = new Alias();

            expect(alias['aliases'].size).to.equal(0);

            alias.destroy();

            expect(alias['aliases']).to.be.null;
        });

        it('should destroy alias storage if alias storage is not empty', () => {
            const alias = new Alias([ 'default', 'hello' ]);

            expect(alias['aliases'].size).to.equal(2);

            alias.destroy();

            expect(alias['aliases']).to.be.null;
        });
    });

    describe('add', () => {
        let alias: Alias;

        beforeEach(() => {
            alias = new Alias();
        });

        it('should add array from 3 aliases to empty array', () => {
            expect(alias['aliases'].size).to.equal(0);

            alias.add(['el1', 'el2', 'el3']);
            expect(alias['aliases'].size).to.equal(3);
        });

        it('should add 1 alias to empty array', () => {
            expect(alias['aliases'].size).to.equal(0);

            alias.add('el1');
            expect(alias['aliases'].size).to.equal(1);
        });

        it('should add array from 3 aliases to array with 2 values', () => {
            alias = new Alias(['el1', 'el2']);
            expect(alias['aliases'].size).to.equal(2);

            alias.add(['el3', 'el4', 'el5']);
            expect(alias['aliases'].size).to.equal(5);
        });

        it('should add 1 alias to empty array', () => {
            alias = new Alias(['el1', 'el2']);
            expect(alias['aliases'].size).to.equal(2);

            alias.add('el3');
            expect(alias['aliases'].size).to.equal(3);
        });

        it('should add only new aliases', () => {
            alias = new Alias(['el1', 'el2']);
            expect(alias['aliases'].size).to.equal(2);

            alias.add('el2');
            expect(alias['aliases'].size).to.equal(2);

            alias.add(['el1', 'el2', 'el3']);
            expect(alias['aliases'].size).to.equal(3);
        });
    });

    describe('has', () => {
        let alias: Alias;

        beforeEach(() => {
            alias = new Alias();
        });

        it('should return "true" if alias is stored in internal storage by default', () => {
            alias = new Alias(['el1', 'el2']);

            let result: boolean;

            result = alias.has('el1');
            expect(result).to.be.true;

            result = alias.has('el2');
            expect(result).to.be.true;
        });

        it('should return "true" if alias was added in empty internal storage later', () => {
            alias = new Alias();
            alias.add(['el1']);

            let result: boolean;

            result = alias.has('el1');
            expect(result).to.be.true;
        });

        it('should return "true" if alias was added in internal storage later', () => {
            alias = new Alias(['el1']);
            alias.add(['el2']);

            let result: boolean;

            result = alias.has('el2');
            expect(result).to.be.true;
        });

        it('should return "false" if alias is not stored in internal storage', () => {
            alias = new Alias(['el1', 'el2']);

            let result: boolean;

            result = alias.has('el3');
            expect(result).to.be.false;

            result = alias.has('el4');
            expect(result).to.be.false;
        });
    });
});
