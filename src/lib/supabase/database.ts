import type { Database as GeneratedDatabase } from "./database.types";

// PostgREST accepts numeric arguments as decimal strings. Keep generated row
// types unchanged; refine only this wire contract to avoid lossy Number coercion.
type QuoteRpc = GeneratedDatabase["public"]["Functions"]["create_quote_atomic"];
export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Functions"> & {
    Functions: Omit<
      GeneratedDatabase["public"]["Functions"],
      "create_quote_atomic"
    > & {
      create_quote_atomic: Omit<QuoteRpc, "Args"> & {
        Args: Omit<
          QuoteRpc["Args"],
          "p_freight" | "p_tax" | "p_discount" | "p_currency" | "p_delivery"
        > & {
          p_freight: string | null;
          p_tax: string | null;
          p_discount: string | null;
          p_currency: string | null;
          p_delivery: number | null;
        };
      };
    };
  };
};
