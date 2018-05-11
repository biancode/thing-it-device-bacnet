import * as _ from 'lodash';

import { Alias } from './alias';
import { APIError } from '../errors';

import { IAliasMapElement } from '../interfaces';

export class AliasMap <T> {
    private aliases: Alias[];
    private storage: Map<symbol, T>;

    constructor (entries?: IAliasMapElement<T>[]) {
        this.storage = new Map();
        this.aliases = [];

        _.map(entries, (entry) => {
            if (_.isNil(entry.alias)) {
                throw new APIError('AliasMap - constructor: Alias name is required!');
            }

            // Create alias and add it to array with aliases
            this.addAlias(entry.alias);

            if (_.isNil(entry.value)) {
                return;
            }

            // Get alias tag
            const aliasTag: string = _.isArray(entry.alias)
                ? entry.alias[0] || '' : entry.alias;

            // Set value
            this.set(aliasTag, entry.value);
        });
    }

    /**
     * destroy - destroys the current map of aliases. Steps:
     * - call "clear" method
     * - remove value storage
     * - remove alias storage
     *
     * @return {void}
     */
    public destroy (): void {
        this.clear();
        this.storage = null;
        this.aliases = null;
    }

    /**
     * size - size of value storage.
     *
     * @type {number}
     */
    get size () {
        return this.storage.size;
    }

    /**
     * has - returns "true" if value from internal storage exists.
     *
     * @param  {string} aliasTag - alias
     * @return {boolean}
     */
    public has (aliasTag: string): boolean {
        const aliasId = this.getAliasId(aliasTag);
        return this.storage.has(aliasId);
    }

    /**
     * get - returns the value from internal storage.
     *
     * @param  {string} aliasTag - alias
     * @return {T}
     */
    public get (aliasTag: string): T {
        const aliasId = this.getAliasId(aliasTag);
        return this.storage.get(aliasId);
    }

    /**
     * set - sets the value in internal storage by alias tag.
     *
     * @param  {string} aliasTag - alias
     * @param  {T} value - new value
     * @return {void}
     */
    public set (aliasTag: string, value: T): void {
        let aliasId = this.getAliasId(aliasTag);

        if (_.isNil(aliasId)) {
            const newAlias = this.addAlias(`${aliasTag}`);
            aliasId = newAlias.id;
        }

        this.storage.set(aliasId, value);
    }

    /**
     * set - sets the value in internal storage by alias tag.
     *
     * @return {void}
     */
    public clear (): void {
        this.storage.clear();

        _.map(this.aliases, (alias) => {
            alias.destroy();
        });

        this.aliases = [];
    }

    /**
     * addAlias - creates the instance of Alias class and adds this instance to
     * internal aliases array.
     *
     * @param  {string|string[]} aliases - alias or lias of aliases
     * @return {Alias} - new alias
     */
    public addAlias (aliases: string|string[]): Alias {
        const alias = new Alias(aliases);
        this.aliases.push(alias);
        return alias;
    }

    /**
     * getAlias - finds an alias by alias tag.
     *
     * @param  {string} aliasTag - alias
     * @return {AliasUtil} - alias instance
     */
    public getAlias (aliasTag: string): Alias {
        return _.find(this.aliases, (alias) => alias.has(aliasTag));
    }

    /**
     * getAliasId - finds an alias by alias tag and extracts the ID of alias.
     *
     * @param  {string} aliasTag - alias
     * @return {symbol} - ID of alias
     */
    private getAliasId (aliasTag: string): symbol {
        const alias: Alias = this.getAlias(aliasTag);

        return _.isNil(alias) ? null : alias.id;
    }

    /**
     * forEach - loops through the value storage.
     *
     * @param {(value:T) => void} callback
     * @return {void}
     */
    public forEach (callback: (value: T) => void): void {
        this.storage.forEach((value) => {
            callback(value);
        });
    }
}
