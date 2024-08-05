"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entry = void 0;
class Entry {
    constructor(contents, expireTS) {
        this.contents = contents;
        this.expireTS = (expireTS === undefined) ? null : expireTS;
    }
    get expired() {
        if (this.expireTS !== null) {
            return Date.now() > this.expireTS;
        }
        else {
            return false;
        }
    }
}
exports.Entry = Entry;
