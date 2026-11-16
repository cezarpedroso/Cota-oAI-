export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      ai_extraction_limit_config: {
        Row: {
          daily_limit: number;
          id: boolean;
          per_minute_limit: number;
          updated_at: string;
        };
        Insert: {
          daily_limit?: number;
          id?: boolean;
          per_minute_limit?: number;
          updated_at?: string;
        };
        Update: {
          daily_limit?: number;
          id?: boolean;
          per_minute_limit?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_extraction_usage_daily: {
        Row: {
          request_count: number;
          usage_date: string;
          user_id: string;
        };
        Insert: {
          request_count?: number;
          usage_date: string;
          user_id: string;
        };
        Update: {
          request_count?: number;
          usage_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_extraction_usage_daily_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_extraction_usage_windows: {
        Row: {
          request_count: number;
          user_id: string;
          window_started_at: string;
        };
        Insert: {
          request_count?: number;
          user_id: string;
          window_started_at: string;
        };
        Update: {
          request_count?: number;
          user_id?: string;
          window_started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_extraction_usage_windows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          preferred_locale: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          preferred_locale?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          preferred_locale?: string;
        };
        Relationships: [];
      };
      quote_items: {
        Row: {
          description: string | null;
          id: string;
          line_total: number | null;
          quantity: number | null;
          quote_id: string;
          rfq_id: string;
          rfq_item_id: string;
          unit: string | null;
          unit_price: number | null;
        };
        Insert: {
          description?: string | null;
          id?: string;
          line_total?: number | null;
          quantity?: number | null;
          quote_id: string;
          rfq_id: string;
          rfq_item_id: string;
          unit?: string | null;
          unit_price?: number | null;
        };
        Update: {
          description?: string | null;
          id?: string;
          line_total?: number | null;
          quantity?: number | null;
          quote_id?: string;
          rfq_id?: string;
          rfq_item_id?: string;
          unit?: string | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_rfq_id_fkey";
            columns: ["quote_id", "rfq_id"];
            isOneToOne: false;
            referencedRelation: "vendor_quotes";
            referencedColumns: ["id", "rfq_id"];
          },
          {
            foreignKeyName: "quote_items_rfq_id_fkey";
            columns: ["rfq_id"];
            isOneToOne: false;
            referencedRelation: "rfq_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_rfq_item_id_rfq_id_fkey";
            columns: ["rfq_item_id", "rfq_id"];
            isOneToOne: false;
            referencedRelation: "rfq_items";
            referencedColumns: ["id", "rfq_id"];
          },
        ];
      };
      rfq_items: {
        Row: {
          description: string;
          id: string;
          quantity: number;
          rfq_id: string;
          specifications: Json | null;
          unit: string;
        };
        Insert: {
          description: string;
          id?: string;
          quantity: number;
          rfq_id: string;
          specifications?: Json | null;
          unit: string;
        };
        Update: {
          description?: string;
          id?: string;
          quantity?: number;
          rfq_id?: string;
          specifications?: Json | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rfq_items_rfq_id_fkey";
            columns: ["rfq_id"];
            isOneToOne: false;
            referencedRelation: "rfq_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      rfq_sessions: {
        Row: {
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rfq_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_quotes: {
        Row: {
          created_at: string;
          currency: string | null;
          delivery_days: number | null;
          discount_amount: number | null;
          freight_cost: number | null;
          id: string;
          payment_terms: string | null;
          raw_text: string | null;
          revision: number;
          rfq_id: string;
          status: string;
          tax_amount: number | null;
          vendor_name: string;
        };
        Insert: {
          created_at?: string;
          currency?: string | null;
          delivery_days?: number | null;
          discount_amount?: number | null;
          freight_cost?: number | null;
          id?: string;
          payment_terms?: string | null;
          raw_text?: string | null;
          revision?: number;
          rfq_id: string;
          status?: string;
          tax_amount?: number | null;
          vendor_name: string;
        };
        Update: {
          created_at?: string;
          currency?: string | null;
          delivery_days?: number | null;
          discount_amount?: number | null;
          freight_cost?: number | null;
          id?: string;
          payment_terms?: string | null;
          raw_text?: string | null;
          revision?: number;
          rfq_id?: string;
          status?: string;
          tax_amount?: number | null;
          vendor_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_quotes_rfq_id_fkey";
            columns: ["rfq_id"];
            isOneToOne: false;
            referencedRelation: "rfq_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_ai_extraction_quota: {
        Args: never;
        Returns: {
          daily_remaining: number;
          window_remaining: number;
        }[];
      };
      create_quote_atomic: {
        Args: {
          p_currency: string;
          p_delivery: number;
          p_discount: number;
          p_freight: number;
          p_items: Json;
          p_payment_terms: string;
          p_raw_text: string;
          p_rfq_id: string;
          p_tax: number;
          p_vendor_name: string;
        };
        Returns: string;
      };
      create_rfq_atomic: {
        Args: {
          p_currency: string;
          p_description: string;
          p_items: Json;
          p_title: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
