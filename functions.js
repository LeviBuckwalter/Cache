import fs from "node:fs/promises"
import { globals } from "./globals.js"

async function writeCache() {
    /*
    This function turns globals.cacheObj into a JSON string, and then puts that into cache.txt. It deletes whatever was in cache.txt and replaces it.
    */
    await fs.writeFile("./cache.txt", JSON.stringify(globals.cacheObj))
}
export async function readCache() {
    /*
    This function reads cache.txt and copies it into globals.cacheObj. It's like "load in the saved data from my previous session."
    It should probably only ever be run once per session, upon startup.
    */
    globals.cacheObj = JSON.parse(await fs.readFile("./cache.txt"))
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

export function store(item, id) {
    /*
    This is a higher level function. It's for the user. Just say what you want to store and what id to store it under, and that's all you have to think about.
    What the function does is it stores the item in globals.cacheObj under the given id, and then it requests a write to cache.txt.
    */

    globals.cacheObj[id] = item
    requestWrite()
}

export function retrieve(id) {
    /*
    This function just returns the value stored in globals.cacheObj under the given id. It does not read from cache.txt.
    */
    return globals.cacheObj[id]
}

export function inCacheObj(id) {
    return globals.cacheObj.hasOwnProperty(id)
}