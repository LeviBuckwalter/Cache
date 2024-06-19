import { cache } from "../cache.js"
import { Entry } from "../classes/Entry.js"
import { addToLedger, removeFromLedger, trimCache } from "./metaFunctions.js"


export function store(key, contents, shelfLife) {
    const expireTS = (shelfLife) ? Date.now() + shelfLife : undefined
    const entry = new Entry(contents, expireTS)
    cache.entries[key] = entry
    addToLedger(key)
    cache.metadata.amtEntries++
    cache.metadata.totalBites += entry.bites
    trimCache()
}

export function retrieve(key) {
    //is there an entry under this key?
    if (!cache.entries.hasOwnProperty(key)) {
        //no:
        return undefined
    }
    //yes:

    //is the entry expired?
    const entry = cache.entries[key]
    if (entry.expired) {
        //yes:
        discard(key)
        return undefined
    }
    //no:

    //update ledger and return
    removeFromLedger(key)
    addToLedger(key)
    return entry.contents
}

export function discard(key) {
    //is there an entry under this key?
    if (!cache.entries.hasOwnProperty(key)) {
        console.log(`was asked to discard the entry under "${key}", but no such entry exists`)
        return
    }

    cache.metadata.amtEntries--
    cache.metadata.totalBites -= cache.entries[key].bites
    removeFromLedger(key)
    delete cache.entries[key]
}

export function keysThatStartWith(string) {
    const regex = new RegExp(`^${string}.*`)
    const keys = Object.keys(cache.entries)
    return keys.filter(key => regex.test(key))
}