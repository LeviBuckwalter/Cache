/*
node terminal pastable:
let {customStringify, customParse} = await import("./functions/parseAndStringify.js")
let { Entry } = await import("./classes/entry.js")
let E = new Entry("bread_thoughts", ["mmmmmmm bread", "god i love bread", "breadbreadbread"], true, 1000000)
let obj = {undefined: undefined, null: null, NaN: NaN, Infinity: Infinity}
let str = customStringify(obj)
*/

/*
So in order to be stored in the cache, your class must have a toSeed() function. This function must return something that is JSON friendly, but that can be passed to your class's constructor to perfectly recreate the object as it was before stringification. The seed must be an array of parameters. And then it's gonna be passed to the constructor like this: new constructor(...seed). So when you're writing the toSeed function, you have to make it return an array of parameters such that if you spread the seed into the constructor, it will recreate the original object.
Also, your class must be added to the classes dictionary, so that the reviver knows what constructor to call when all it has is the string of the constructor's name.


Mark II:
I will pass in to the customStringify and customParse functions the type that it will be encountering. (because I will know what type of entries are stored in the cache when I call these functions.)
*/


export function customStringify(given: unknown): string {
    //does not preserve NaNs (become null)

    function replacer(_key: string, value: any) {
        if (value !== value) { // Check for NaN
            return { __type: 'NaN' };
        }
        if (value) {
            if (value.__type) {
                console.error(`asked to replace something which will confuse the reviver! unable to replace objects with properties called "__type".`)
                return undefined
            }

            if (value === Infinity) {
                return {__type: "Infinity"}
            }
            if (value instanceof Set) {
                return { __type: `Set`, seed: [...value] }
            }
            if (value.toSeed !== undefined) {
                return {__type: value.constructor.name, seed: value.toSeed()}
            }
        }
        //else:
        return value
    }

    return JSON.stringify(given, replacer)
}


type constructor<T> = new (...args: any) => T

export function customParse(string: string, customClasses: constructor<any>[]) {
    function reviver(_key: string, value: any) {
        if (value && value.__type) {
            //if special case:
            if (value.__type === 'NaN') {
                return NaN;
            }
            if (value.__type === 'Infinity') {
                return Infinity;
            }
            if (value.__type === `Set`) {
                return new Set(value.seed)
            }
            //if custom class:
            let customClass: constructor<any> | undefined;
            for (const c of customClasses) {
                if (value.__type === c.name) {
                    customClass = c
                    break
                }
            }
            if (!customClass) {
                throw new Error(`customParse encountered a class whose name does not match any of the classes it was given to expect`)
            }
            if (Array.isArray(value.seed)) {
                return new customClass(...value.seed)
            } else {
                return new customClass(value.seed)
            }

            
        }
        //if not special case:
        return value
    }

    return JSON.parse(string, reviver)
}