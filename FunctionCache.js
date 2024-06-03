import { globals } from "./globals.js"

export class FunctionCache {
    constructor(id, func) {
        this.id = id
        this.func = func
        this.memory = {}
    }
    get(parameters) {
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
            this.save()
            return ret
        }
    }
    save() {
        globals.cacheObj[this.id] = this.memory
        globals.cacheUpToDate = false
    }
    load() {
        if (globals.cacheObj[this.id] === undefined) {
            this.memory = {}
        } else {
            this.memory = globals.cacheObj[this.id]
        }
    }
    async clearCache() {
        this.memory = {}
        this.save()
    }
}