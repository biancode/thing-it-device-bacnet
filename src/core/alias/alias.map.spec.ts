import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { AliasMap } from './alias.map';

describe('Alias', () => {
    describe('constructor', () => {
        it('should create empty data and alias storage', () => {
            const aliasStorage = new AliasMap();
            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(0);
        });

        it('should create empty data storage and alias storage with 2 alias', () => {
            const aliasStorage = new AliasMap([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el2', 'el3'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(2);
        });

        it('should create empty data storage and alias storage with 2 alias', () => {
            const aliasStorage = new AliasMap([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el2', 'el3'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(2);
        });

        it('should create data storage with 2 elements and alias storage with 2 alias', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'data1',
                },
                {
                    alias: ['el2', 'el3'],
                },
                {
                    alias: ['el4', 'el5'],
                    value: 'data2',
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(2);
            expect(aliasStorage['aliases'].length).to.equal(3);
        });
    });

    describe('get', () => {
        it('should return "undefined" if aliases are not exist', () => {
            const aliasStorage = new AliasMap<string>();

            const result = aliasStorage.get('el4');
            expect(result).to.be.undefined;
        });

        it('should return "undefined" for alias with multitag if value is not exist', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            const result = aliasStorage.get('el4');
            expect(result).to.be.undefined;
        });

        it('should return "undefined" for alias with singletag if value is not exist', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            const result = aliasStorage.get('el1');
            expect(result).to.be.undefined;
        });

        it('should return value for alias with multitag if value is exist in storage', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                    value: 'Hello!',
                },
            ]);

            const result = aliasStorage.get('el4');
            expect(result).to.be.equal('Hello!');
        });

        it('should return value for alias with singletag if value is exist in storage', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'Hi!',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            const result = aliasStorage.get('el1');
            expect(result).to.equal('Hi!');
        });
    });

    describe('set', () => {
        it('should create new alias and set value if alias is not exist', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage.get('el2')).to.be.undefined;
            expect(aliasStorage.has('el2')).to.be.false;

            aliasStorage.set('el2', 'New alias!');
            expect(aliasStorage['aliases'].length).to.equal(3);
            expect(aliasStorage.get('el2')).to.equal('New alias!');
        });

        it('should set value in empty data storage with multitag', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage.get('el4')).to.be.undefined;

            aliasStorage.set('el4', 'hello!');
            expect(aliasStorage.get('el4')).to.equal('hello!');
        });

        it('should set value in empty data storage with singletag', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage.get('el1')).to.be.undefined;

            aliasStorage.set('el1', 'hello!');
            expect(aliasStorage.get('el1')).to.equal('hello!');
        });

        it('should set value in data storage with 1 element with singletag', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'Hello!',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage.get('el1')).to.equal('Hello!');

            aliasStorage.set('el1', 'Hello test!');
            expect(aliasStorage.get('el1')).to.equal('Hello test!');
        });

        it('should set value in data storage with 1 element with multitag', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                    value: 'Hello!',
                },
            ]);

            expect(aliasStorage.get('el5')).to.equal('Hello!');

            aliasStorage.set('el5', 'Hi!');
            expect(aliasStorage.get('el4')).to.equal('Hi!');
        });
    });

    describe('has', () => {
        it('should return "true" if value is stored in internal storage by default', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'data1',
                },
                {
                    alias: ['el4', 'el5'],
                    value: 'data2',
                },
            ]);

            expect(aliasStorage.has('el1')).to.be.true;
            expect(aliasStorage.has('el4')).to.be.true;
        });

        it('should return "false" if value is not stored in internal storage', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage.has('el1')).to.be.false;
            expect(aliasStorage.has('el2')).to.be.false;
            expect(aliasStorage.has('el4')).to.be.false;
        });
    });

    describe('addAlias', () => {
        it('should add new alias to empty alias storage', () => {
            const aliasStorage = new AliasMap<string>();

            expect(aliasStorage['aliases'].length).to.equal(0);

            aliasStorage.addAlias('0');
            expect(aliasStorage['aliases'].length).to.equal(1);
        });

        it('should add new alias to alias storage with 2 elements', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage['aliases'].length).to.equal(2);

            aliasStorage.addAlias('0');
            expect(aliasStorage['aliases'].length).to.equal(3);
        });
    });

    describe('clear', () => {
        it('should clear alias map if it has aliases but does not have values', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(2);

            aliasStorage.clear();
            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(0);
        });

        it('should clear alias map if it has values and aliases', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'value 1',
                },
                {
                    alias: ['el4', 'el5'],
                },
                {
                    alias: ['el6'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(1);
            expect(aliasStorage['aliases'].length).to.equal(3);

            aliasStorage.clear();
            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(0);
        });
    });

    describe('destroy', () => {
        it('should destroy alias map if it has aliases but does not have values', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(2);

            aliasStorage.destroy();
            expect(aliasStorage['storage']).to.be.null;
            expect(aliasStorage['aliases']).to.be.null;
        });

        it('should destroy alias map if it has values and aliases', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'value 1',
                },
                {
                    alias: ['el4', 'el5'],
                },
                {
                    alias: ['el6'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(1);
            expect(aliasStorage['aliases'].length).to.equal(3);

            aliasStorage.destroy();
            expect(aliasStorage['storage']).to.be.null;
            expect(aliasStorage['aliases']).to.be.null;
        });
    });

    describe('size', () => {
        it('should return 0 if value storage is empty', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                },
                {
                    alias: ['el4', 'el5'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(0);
            expect(aliasStorage['aliases'].length).to.equal(2);

            expect(aliasStorage.size).to.equal(0);
        });

        it('should return size of value storage if value storage is not empty', () => {
            const aliasStorage = new AliasMap<string>([
                {
                    alias: 'el1',
                    value: 'value 1',
                },
                {
                    alias: ['el4', 'el5'],
                },
                {
                    alias: ['el6'],
                },
            ]);

            expect(aliasStorage['storage'].size).to.equal(1);
            expect(aliasStorage['aliases'].length).to.equal(3);

            expect(aliasStorage.size).to.equal(1);
        });
    });
});
