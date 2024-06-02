import { writeCache, readCache } from "./functions.js"
//import { cacheObj } from "./global variables.js"
import { cacheObj } from "./functions.js"

export class Cacher {
    constructor(name, func) {
        this.name = name
        this.func = func
        this.memory = {}
    }
    async get(parameters) {
        /*
        If you are entering more than one parameter, they must be given inside an array.
        */

        let memoryKey
        if (Array.isArray(parameters)) {
            memoryKey = parameters.join("_")
        } else {
            memoryKey = parameters
            parameters = [parameters]
        }

        if (this.memory.hasOwnProperty(memoryKey)) {
            return this.memory[memoryKey]
        } else {
            let ret = this.func(...parameters)
            this.memory[memoryKey] = ret
            await this.save()
            return ret
        }
    }
    async save() {
        cacheObj[this.name] = this.memory
        await writeCache()
    }
    async load() {
        await readCache()
        if (cacheObj[this.name] === undefined) {
            this.memory = {}
        } else {
            this.memory = cacheObj[this.name]
        }
    }
    async clearMemory() {
        this.memory = {}
        await this.save()
    }
}