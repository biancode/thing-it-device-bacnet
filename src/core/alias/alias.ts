import * as _ from 'lodash';

export class Alias {
    private aliases: Set<string>;
    private _id: symbol;

    constructor (aliases?: string|string[]) {
        this.aliases = new Set();
        this._id = Symbol('alias');

        this.add(aliases);
    }

    /**
     * id - unique identifier of alias.
     *
     * @property
     */
    get id (): symbol {
        return this._id;
    }

    /**
     * destroy - destroys the current instance of alias. Steps:
     * - clear alias storage
     * - remove alias storage
     * - remove alias ID
     *
     * @return {void}
     */
    public destroy (): void {
        this.aliases.clear();
        this.aliases = null;
        this._id = null;
    }

    /**
     * add - adds the alias or aliases to internal "Set" store.
     *
     * @param  {string|string[]} aliases - list of aliases
     * @return {void}
     */
    public add (aliases: string|string[]): void {
        if (!aliases) {
            return;
        }

        const arrAliases = _.isArray(aliases) ? aliases : [aliases];

        _.map(arrAliases, (alias) => {
            const aliasTagLow = alias.toLowerCase();
            this.aliases.add(aliasTagLow);
        });
    }

    /**
     * has - returns "true" if value exists in internal store.
     *
     * @param  {string} aliasTag - alias
     * @return {boolean}
     */
    public has (aliasTag: string): boolean {
        const aliasTagLow = aliasTag.toLowerCase();
        return this.aliases.has(aliasTagLow);
    }
}
