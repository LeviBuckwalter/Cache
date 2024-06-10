import fs from "node:fs/promises" //allows for reading/writing files
import { globals } from "./globals.js"
import { removeAllExpired, trimCache } from "./cacheManagement.js"

export async function readCache() {
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

export function requestWrite() {
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

