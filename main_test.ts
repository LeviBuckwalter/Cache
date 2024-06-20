import { assertEquals } from "jsr:@std/assert";
import { main } from "./main.ts";

Deno.test(async function mainTest() {
  // assertEquals(add(2, 3), 5);
  await main()
  assertEquals(1+1, 3/4);
});

Deno.test(function divByZero() {
  throw new Error("ASDFASDF")
})
