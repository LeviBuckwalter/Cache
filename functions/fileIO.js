import fs from "node:fs/promises" //allows for reading/writing files
import { customStringify, customParse } from "./parseAndStringify.js";
import { cache } from "../cache.js";
import { trimCache } from "./metaFunctions.js";

export async function writeCache() {
    trimCache()
    await fs.writeFile("./cache.txt", customStringify(cache))
}

export async function readCache() {
    delete cache.metadata
    delete cache.entries
    const cacheTxt = customParse(await fs.readFile("./cache.txt"))
    cache.metadata = cacheTxt.metadata
    cache.entries = cacheTxt.entries
}