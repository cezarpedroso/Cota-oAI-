import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const required = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_USER_A_EMAIL",
  "SUPABASE_TEST_USER_A_PASSWORD",
  "SUPABASE_TEST_USER_B_EMAIL",
  "SUPABASE_TEST_USER_B_PASSWORD",
];

describe.skipIf(required.some((key) => !process.env[key]))(
  "RLS integration",
  () => {
    const url = process.env.SUPABASE_TEST_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const a = createClient(url, key);
    const b = createClient(url, key);
    const anon = createClient(url, key);
    let rfq = "";
    let item = "";
    let quote = "";
    beforeAll(async () => {
      for (const [client, email, password] of [
        [
          a,
          process.env.SUPABASE_TEST_USER_A_EMAIL,
          process.env.SUPABASE_TEST_USER_A_PASSWORD,
        ],
        [
          b,
          process.env.SUPABASE_TEST_USER_B_EMAIL,
          process.env.SUPABASE_TEST_USER_B_PASSWORD,
        ],
      ] as const)
        expect(
          (
            await client.auth.signInWithPassword({
              email: email ?? "",
              password: password ?? "",
            })
          ).error,
        ).toBeNull();
      const user = (await a.auth.getUser()).data.user;
      if (!user) throw new Error("User A session was not established");
      const created = await a
        .from("rfq_sessions")
        .insert({ title: "RLS quote test", user_id: user.id })
        .select()
        .single();
      if (created.error || !created.data)
        throw new Error("Could not create RFQ fixture");
      rfq = created.data.id;
      const createdItem = await a
        .from("rfq_items")
        .insert({ rfq_id: rfq, description: "item", quantity: 1, unit: "ea" })
        .select()
        .single();
      if (createdItem.error || !createdItem.data)
        throw new Error("Could not create item fixture");
      item = createdItem.data.id;
    });
    afterAll(async () => {
      if (rfq) await a.from("rfq_sessions").delete().eq("id", rfq);
    });
    it("isolates quotation mutations", async () => {
      const created = await a
        .from("vendor_quotes")
        .insert({ rfq_id: rfq, vendor_name: "A" })
        .select()
        .single();
      if (created.error || !created.data)
        throw new Error("Could not create quotation fixture");
      quote = created.data.id;
      expect(
        (
          await a.from("quote_items").insert({
            rfq_id: rfq,
            quote_id: quote,
            rfq_item_id: item,
            quantity: 1,
          })
        ).error,
      ).toBeNull();
      const read = await b.from("vendor_quotes").select().eq("id", quote);
      expect(read.error).toBeNull();
      expect(read.data).toHaveLength(0);
      expect(
        (
          await b
            .from("vendor_quotes")
            .insert({ rfq_id: rfq, vendor_name: "B" })
        ).error,
      ).not.toBeNull();
      const update = await b
        .from("vendor_quotes")
        .update({ vendor_name: "blocked" })
        .eq("id", quote)
        .select("id");
      expect(update.error).toBeNull();
      expect(update.data).toHaveLength(0);
      const deletion = await b
        .from("vendor_quotes")
        .delete()
        .eq("id", quote)
        .select("id");
      expect(deletion.error).toBeNull();
      expect(deletion.data).toHaveLength(0);
      const ownerRead = await a
        .from("vendor_quotes")
        .select("id,vendor_name")
        .eq("id", quote);
      expect(ownerRead.error).toBeNull();
      if (!ownerRead.data || ownerRead.data.length !== 1)
        throw new Error(
          "User A can no longer read the original quotation after User B mutations",
        );
      expect(ownerRead.data[0].vendor_name).toBe("A");
      expect(
        (await anon.from("vendor_quotes").select().eq("id", quote)).error,
      ).not.toBeNull();
    });
  },
);
