import { Cacher } from "./Cacher.js"

export async function test() {
    const c = new Cacher("c", Math.pow)
    console.log(await c.get([2, 3]))
}