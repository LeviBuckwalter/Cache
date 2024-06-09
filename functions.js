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
        setTimeout(() => { writeCache; globals.writePending = false }, 250)
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
    if (mark.expireTS === null) {
        //expireTS === null means it's evergreen and won't expire. I don't know what happens when you try to do a setTimeout with a duration of null.
        console.log("mark.expireTS === null")
        //my code is supposed to stop it before it gets here if its null, although nothing will break if it gets here.
        return
    } else {
        setTimeout(
            () => {
                if (Date.now() >= mark.expireTS - 5) {
                    discard(cacheKey)
                } else {
                    console.log("it wasn't time yet")
                    console.log(mark.expireTS, Date.now())
                    console.log(mark)
                }
            },
            /*duration:*/ mark.expireTS - Date.now()
        )
    }

}

function removeAllExpired() {
    /*
    Expired entries will be removed automatically, but when you first boot up your program there are bound to be a bunch of entries that have expired "overnight," so to speak, and those won't be removed automatically. So this function will go through the cache manually and remove items that are past expiration.
    */
    let cacheKeys = Object.keys(globals.cache)
    for (let key of cacheKeys) {
        const entry = globals.cache[key]
        if (entry.expireTS !== null) {
            if (Date.now() >= entry.expireTS) {
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
        expireTS: (shelfLife === null) ? null : Date.now() + shelfLife,
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
    */
    return globals.cache[key].item
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
        if (entry.expireTS !== null) {
            discard(key)
        }
    }
    requestWrite()
}