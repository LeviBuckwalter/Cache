import { store, retrieve, discard } from "./functions/endUser.js"
import { cache } from "./cache.js"
import { readCache, writeCache } from "./functions/fileIO.js"
import { customStringify, customParse } from "./functions/parseAndStringify.js"
await readCache()
console.log(cache)