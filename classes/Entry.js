import { customStringify } from "../functions/parseAndStringify.js"
import { params } from "../parameters.js"

export class Entry {
    constructor(contents, expireTS) {
        this.contents = contents
        this.expireTS = expireTS //null if doesn't expire
        this.bites = customStringify(this.contents).length + params.entryExtraBites
    }

    get expired() {
        if (this.expireTS !== null) {
            return Date.now() > this.expireTS
        } else {
            return false
        }
    }
}