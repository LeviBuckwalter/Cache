import { globals } from "./globals.js"
import { removeAllExpired, recordAccess, putOutHit } from "./cacheManagement.js"
import { readCache, requestWrite } from "./fileIO.js"

export async function initializeCache() {
    /*
    This function is for the end user. It will copy cache.txt into globals.cache, and then it will remove any entries that have expired "overnight." This function should be called once at the beginning of each session in order for the cache to work.
    */
    await readCache()
    removeAllExpired()
}

export function store(item, key, shelfLife) {
    /*
    This is a higher level function; it's for the end user. Just say what you want to store, what key to store it under, and how long until it should expire, and that's all you have to think about.
    */
    const entry = {
        item: item,
        conceptionTS: Date.now(),
        expirationTS: (shelfLife === null) ? null : Date.now() + shelfLife,
    }

    globals.cache[key] = entry
    if (shelfLife !== null) {
        putOutHit(key)
    }

    requestWrite()
}

export function retrieve(key) {
    /*
    This function returns the *item* stored in globals.cache under the given key. It does not read from cache.txt. And it will not return the entire entry! Just the item. This function is for the end user, not so much for use in this file, because here we often need the entire entry, not just the item.
    ALSO: it increments the entry's retrievals counter! So really this function shouldn't be used except by the end user.
    */
    recordAccess(key)
    const entry = globals.cache[key]
    return entry.item
}

export function discard(key) {
    delete globals.cache[key]
    requestWrite()
}

export function keysThatStartWith(string) {
    const regex = new RegExp(`^${string}.*`)
    const keys = Object.keys(globals.cache)
    return keys.filter(key => regex.test(key))
}

export function inCache(key) {
    /*
    checks if there's an entry under that key
    */
    return globals.cache.hasOwnProperty(key)
}

export function clearCache() {
    /*
    This function deletes every entry from the cache except those with an expiration timestamp of null. It's like when caseoh said "ban everybody, we're doin a fresh start."
    */

    const cacheKeys = Object.keys(globals.cache)
    for (let key of cacheKeys) {
        const entry = globals.cache[key]
        if (entry.expirationTS !== null) {
            discard(key)
        }
    }
    requestWrite()
}