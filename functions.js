import fs from "node:fs/promises"
import { globals } from "./globals.js"

export async function writeCache() {
    await fs.writeFile("./cache.txt", JSON.stringify(globals.cacheObj))
}
export async function readCache() {
    globals.cacheObj = JSON.parse(await fs.readFile("./cache.txt"))
}

export function startCaching(milliseconds) {
    if (milliseconds === undefined) {
        milliseconds = 250
    }
    function cache() {
        if (!globals.cacheUpToDate) {
            writeCache()
            globals.cacheUpToDate = true
        }
    }
    setInterval(cache, milliseconds)
}