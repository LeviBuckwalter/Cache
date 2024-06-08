import fs from "node:fs/promises"
import { globals } from "./globals.js"

function putOutHit(cacheKey) {
    const mark = globals.cacheObj[cacheKey]
    if (mark.expireTS === null) {
        //expireTS === null means it's evergreen and won't expire. It throws an error when you try to and do a setTimeout with a duration of null.
        console.log("mark.expireTS === null")
        return
    } else {
        setTimeout(
            function () {
                if (Date.now() >= mark.expireTS - 5) {
                    discard(cacheKey)
                } else {
                    console.log("it wasn't time yet")
                    console.log(mark.expireTS, Date.now())
                    console.log(mark)
                }
            },
            mark.expireTS - Date.now()
        )
    }

}

function removeAllExpired() {
    /* Expired entries will be removed automatically, but when you first boot up your program there are bound to be a bunch of things that are expired, and those won't be removed automatically. So this function will go through the cache manually and remove items that are past expiration. */
    let cacheKeys = Object.keys(globals.cacheObj)
    for (let key of cacheKeys) {
        const entry = globals.cacheObj[key]
        if (entry.expireTS !== null) {
            if (Date.now() >= entry.expireTS) {
                discard(key)
            } else {
                putOutHit(key)
            }
        }
    }
}

export async function readCache() {
    /*
    This function reads cache.txt and copies it into globals.cacheObj. It's like "load in the saved data from my previous session."
    It should probably only ever be run once per session, upon startup.
    */
    globals.cacheObj = JSON.parse(await fs.readFile("./cache.txt"))
}

export async function initializeCache() {
    await readCache()
    removeAllExpired()
}

async function writeCache() {
    /*
    This function turns globals.cacheObj into a JSON string, and then puts that into cache.txt. It deletes whatever was in cache.txt and replaces it.
    */
    await fs.writeFile("./cache.txt", JSON.stringify(globals.cacheObj))
}

function requestWrite() {
    /*
    The reason for this function is that I don't want to be writing to the cache a hundred times per second. So, instead, whenever I want to write to the cache, I call this function, and it will either start a pending action to write to cache, or it will do nothing if it sees that there is already a pending action to write to the cache.
    */

    if (globals.writePending) {
        //do nothing
    } else {
        globals.writePending = true
        function f() {
            writeCache()
            globals.writePending = false
        }
        setTimeout(f, 250)
    }
}

export function store(item, key, shelfLife) {
    /*
    This is a higher level function. It's for the user. Just say what you want to store and what id to store it under, and that's all you have to think about.
    What the function does is it stores the item in globals.cacheObj under the given id, and then it requests a write to cache.txt.
    */
    const entry = {
        item: item,
        conceptionTS: Date.now(),
        expireTS: (shelfLife === null) ? null : Date.now() + shelfLife,
    }

    globals.cacheObj[key] = entry
    if (shelfLife !== null) {
        putOutHit(key)
    }
    requestWrite()
}

export function retrieve(key) {
    /*
    This function just returns the value stored in globals.cacheObj under the given id. It does not read from cache.txt.
    */
    return globals.cacheObj[key].item
}

export function inCacheObj(key) {
    return globals.cacheObj.hasOwnProperty(key)
}

export function discard(key) {
    delete globals.cacheObj[key]
    requestWrite()
}

export function clearCache() {
    const cacheKeys = Object.keys(globals.cacheObj)
    for (let key of cacheKeys) {
        const entry = globals.cacheObj[key]
        if (entry.expireTS !== null) {
            discard(key)
        }
    }
    requestWrite()
}