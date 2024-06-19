/*
node terminal pastable:
let {customStringify, customParse} = await import("./functions/parseAndStringify.js")
let { Entry } = await import("./classes/entry.js")
let E = new Entry("bread_thoughts", ["mmmmmmm bread", "god i love bread", "breadbreadbread"], true, 1000000)
let obj = {undefined: undefined, null: null, NaN: NaN, Infinity: Infinity}
let str = customStringify(obj)
*/

import { Entry } from "../classes/Entry.js"

export function customStringify(given) {
    //does not preserve NaNs (become null)

    function replacer(key, value) {
        if (value && value.__type) {
            console.log(`asked to replace something which will confuse the reviver! unable to replace objects with properties called "__type".`)
            return undefined
        }

        if (value instanceof Set) {
            return { __type: `Set`, contents: [...value] }
        }
        if (value instanceof Entry) {
            return { __type: `Entry`, skeleton: { contents: value.contents, expireTS: value.expireTS } }
        }
        //This causes maximum callback error:
        // if (isNaN(value)) {
        //     return { __type: "NaN" }
        // }
        if (value === Infinity) {
            return { __type: "Infinity" }
        }
        //this might not be doing anything?
        if (value === undefined) {
            return { __type: "undefined" }
        }

        //else:
        return value
    }

    return JSON.stringify(given, replacer)
}

export function customParse(string) {
    function reviver(key, value) {
        if (value) {
            if (value.__type === `Set`) {
                return new Set(value.contents)
            }
            if (value.__type === `Entry`) {
                let E = new Entry(value.skeleton.contents, value.skeleton.expireTS)
                return E
            }
            //NaN doesn't work
            // if (value.__type === `NaN`) {
            //     return NaN
            // }
            if (value.__type === `Infinity`) {
                return Infinity
            }
            if (value.__type === `undefined`) {
                return undefined
            }
        }


        return value
    }

    return JSON.parse(string, reviver)
}