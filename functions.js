import fs from "node:fs/promises" //allows for reading/writing files
import { globals } from "./globals.js"

async function readCache() {
    /*
    This function reads cache.txt and copies it into globals.cache. It's like "load in the saved data from my previous session."
    It should probably only ever be run once per session, upon startup.
    */
    globals.cache = JSON.parse(await fs.readFile("./cache.txt"))
}

async function writeCache() {
    /*
    This function stringifies globals.cache and then puts it into cache.txt. It deletes whatever was in cache.txt and replaces it.
    */
    trimCache()
    await fs.writeFile("./cache.txt", JSON.stringify(globals.cache))
}

function requestWrite() {
    /*
    The reason for this function is that I don't want to be writing to the cache a hundred times per second (because it can be an expensive process). So, instead, whenever I want to write to the cache, I call this function, and it will either start a pending action to write to cache, or it will do nothing if it sees that there is already a pending action to write to the cache.
    */

    if (globals.writePending) {
        //do nothing
    } else {
        globals.writePending = true
        setTimeout(() => { writeCache(); globals.writePending = false }, 250)
    }
}

function discard(key) {
    delete globals.cache[key]
    requestWrite()
}

function putOutHit(cacheKey) {
    /*
    Starts a setTimeout function that will come back and discard the entry under the given cacheKey at the expiration timestamp. In case the entry under the given key has been discarded and replaced with something fresher by the expiration timestamp, the function makes sure that what it's about to delete is indeed expired.
    In my imagination this is like a hitman who you hire to go assasinate a target, or a mark. Once you've hired the hitman, even if the mark is still alive, you can rest easy knowing it is going to be taken care of. So it's about how you can take this off your mind once you've put out the hit.
    */
    const mark = globals.cache[cacheKey]
    if (mark.expirationTS === null) {
        //expirationTS === null means it's evergreen and won't expire. I don't know what happens when you try to do a setTimeout with a duration of null.
        console.log("mark.expirationTS === null")
        //my code is supposed to stop it before it gets here if its null, although nothing will break if it gets here.
        return
    } else {
        setTimeout(
            () => {
                if (Date.now() >= mark.expirationTS - 5) {
                    discard(cacheKey)
                } else {
                    console.log("it wasn't time yet")
                    console.log(mark.expirationTS, Date.now())
                    console.log(mark)
                }
            },
            /*duration:*/ mark.expirationTS - Date.now()
        )
    }

}

function removeAllExpired() {
    /*
    Expired entries will be removed automatically, but when you first boot up your program there are bound to be a bunch of entries that have expired "overnight," so to speak, and those won't be removed automatically. So this function will go through the cache manually and remove items that are past expiration.
    ALSO: it will "put out hits" on everything it doesn't immediately remove (and that's not expirationTS = null)
    */
    let cacheKeys = Object.keys(globals.cache)
    for (let key of cacheKeys) {
        const entry = globals.cache[key]
        if (entry.expirationTS !== null) {
            if (Date.now() >= entry.expirationTS) {
                discard(key)
            } else {
                putOutHit(key)
            }
        }
    }
}


export function store(item, key, shelfLife) {
    /*
    This is a higher level function; it's for the end user. Just say what you want to store, what key to store it under, and how long until it should expire, and that's all you have to think about.
    */
    const entry = {
        item: item,
        conceptionTS: Date.now(),
        expirationTS: (shelfLife === null) ? null : Date.now() + shelfLife,
        retrievals: 1,
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
    const entry = globals.cache[key]
    entry.retrievals++
    requestWrite()
    return entry.item
}

export function inCache(key) {
    /*
    checks if there's an entry under that key
    */
    return globals.cache.hasOwnProperty(key)
}

export async function initializeCache() {
    /*
    This function is for the end user. It will copy cache.txt into globals.cache, and then it will remove any entries that have expired "overnight." This function should be called once at the beginning of each session in order for the cache to work.
    */
    await readCache()
    removeAllExpired()
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

export function trimCache() {
    console.log(`trimCache was called`)
    function cacheTooBig() {
        /*
        Returns true or false depending on whether the cache is too big. NOTE: it's not looking at cache.txt, it's looking at globals.cache.
        */
        const cacheSize = JSON.stringify(globals.cache).length / 1000000 //~1MB per million characters
        console.log(`cache found to be ${cacheSize} MBs`)
        return cacheSize > 100
    }

    function removeWorst() {
        /*
        Removes the #1 least useful entry from the cache in order to save space.
        */
        function badness(entry) {
            if (entry.expirationTS === null) {
                return 0
            }

            const howLongInCache = Date.now() - entry.conceptionTS
            let factor1 = /*how far along it is towards expiration:*/(howLongInCache) / (entry.expirationTS - entry.conceptionTS)
            factor1 = Math.max(factor1, 0)
            const factor2 = howLongInCache / (entry.retrievals)
            return factor1 * factor2
        }
        const cacheKeys = Object.keys(globals.cache)
        let keyOfWorst
        let maxBadness = 0
        for (let key of cacheKeys) {
            const entry = globals.cache[key]
            console.log(`badness of the entry under "${key}": ${badness(entry)}`)
            if (badness(entry) > maxBadness) {
                maxBadness = badness(entry)
                keyOfWorst = key
            }
        }
        console.log(`removing the entry under "${keyOfWorst}" in order to save space.`)
        discard(keyOfWorst)
    }

    while (cacheTooBig()) {
        removeWorst()
    }
}