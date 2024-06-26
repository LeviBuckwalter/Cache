import { Entry } from "../classes/Entry.ts";
import { customStringify, customParse } from "../functions/parseAndStringify.ts";
import { params } from "../parameters.ts";

type constructor<T> = new (...args: any) => T

export class Cache<T> {
    parameters: {
        name: string
        size: number //in MBs
        customClasses: constructor<any>[]
    }
    metadata: {
        ledger: Set<string>[],
        amtEntries: number,
        totalBytes: number
    }
    entries: { [key: string]: Entry<T> }

    constructor(name: string, size: number, customClasses?: constructor<any>[]) {
        this.parameters = {
            name,
            size,
            customClasses: (customClasses) ? customClasses : []
        }
        this.parameters.customClasses.push(Entry<T>)
        this.metadata = {
            ledger: [],
            amtEntries: 0,
            totalBytes: 0
        }
        this.entries = {}
    }

    async save(): Promise<void> {
        this.trim()
        await Deno.writeTextFile(
            `./${this.parameters.name}.txt`,
            customStringify({
                metadata: this.metadata,
                entries: this.entries
            })
        )
    }

    async load(): Promise<void> {
        this.clear()
        const stringified = await Deno.readTextFile(`./${this.parameters.name}.txt`)
        const parsed = customParse(stringified, this.parameters.customClasses)
        this.metadata = parsed.metadata
        this.entries = parsed.entries
    }

    store(key: string, contents: T, shelfLife?: number): void {
        if (key in this.entries) {
            this.discard(key)
        }
        
        const expireTS = (shelfLife) ? Date.now() + shelfLife : null
        const entry = new Entry<T>(contents, expireTS)
        this.entries[key] = entry
        this.addToLedger(key)
        this.metadata.amtEntries++
        this.metadata.totalBytes += entry.bytes
        this.trim()
    }

    retrieve(key: string): T | undefined {
        //is there an entry under this key?
        if (!(key in this.entries)) {
            return undefined
        }
        //yes:

        //Is the entry expired?
        const entry = this.entries[key]
        if (entry.expired) {
            //Yes:
            this.discard(key)
            return undefined
        }
        //No:

        //Update ledger and return
        this.removeFromLedger(key)
        this.addToLedger(key)
        return entry.contents
    }

    discard(key: string): void {
        //is there an entry under this key?
        if (!(key in this.entries)) {
            console.error(`was asked to discard the entry under "${key}" from the cache named "${this.parameters.name}", but no such entry exists`)
            return
        }

        this.metadata.amtEntries--
        this.metadata.totalBytes -= this.entries[key].bytes
        this.removeFromLedger(key)
        delete this.entries[key]
    }

    clear(): void {
        this.metadata.ledger = []
        this.metadata.amtEntries = 0
        this.metadata.totalBytes = 0
        this.entries = {}
    }

    private addToLedger(key: string): void {
        const { ledger, amtEntries } = this.metadata
        if (ledger.length === 0 || ledger[ledger.length - 1].size > amtEntries * params.ledgSetsMaxRat) {
            ledger.push(new Set())
        }
        ledger[ledger.length - 1].add(key)
    }

    private removeFromLedger(key: string): void {
        //Iterate through ledger and delete key. If this brings the size of the set down to 0, splice the set
        const { ledger } = this.metadata
        for (let i = 0; i < ledger.length; i++) {
            const set = ledger[i]
            if (set.delete(key)) {
                if (set.size === 0) {
                    ledger.splice(i, 1)
                }
                return
            }
        }

        //if not found in ledger:
        throw new Error(`The key "${key}" was asked to be removed from the ledger in the cache ${this}, but was not found in any of the sets.`)
    }

    private trim(): void {
        const mData = this.metadata
        const { ledger } = mData
        const { size } = this.parameters
        function tooBig(): boolean {
            return mData.totalBytes > size*1000000 //size is given in MBs
        }
        if (!tooBig()) {return}
        for (const ledgerSet of ledger) {
            for (const key of ledgerSet.values()) {
                this.discard(key)
                if (!tooBig()) {
                    return
                }
            }
        }
    }
}