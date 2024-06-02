import fs from "node:fs/promises"
//import { cacheObj } from "./global variables.js"

export let cacheObj = {}

export async function writeCache() {
    await fs.writeFile("./cache.txt", JSON.stringify(cacheObj))
}
export async function readCache() {
    cacheObj = JSON.parse(await fs.readFile("./cache.txt"))
}