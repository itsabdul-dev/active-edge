export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cart: {
        Row: {
          cart_id: string;
          created_at: string;
          customer_id: string | null;
          expires_at: string;
          session_token_hash: string | null;
          status: string;
        };
        Insert: {
          cart_id?: string;
          created_at?: string;
          customer_id?: string | null;
          expires_at?: string;
          session_token_hash?: string | null;
          status?: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          customer_id?: string | null;
          expires_at?: string;
          session_token_hash?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customer";
            referencedColumns: ["customer_id"];
          },
        ];
      };
      cart_item: {
        Row: {
          cart_id: string;
          cart_item_id: string;
          quantity: number;
          variant_id: string;
        };
        Insert: {
          cart_id: string;
          cart_item_id?: string;
          quantity: number;
          variant_id: string;
        };
        Update: {
          cart_id?: string;
          cart_item_id?: string;
          quantity?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_item_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "cart";
            referencedColumns: ["cart_id"];
          },
          {
            foreignKeyName: "cart_item_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variant";
            referencedColumns: ["variant_id"];
          },
        ];
      };
      customer: {
        Row: {
          created_at: string;
          customer_id: string;
          first_name: string;
          last_name: string;
          phone: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
        };
        Relationships: [];
      };
      customer_address: {
        Row: {
          address_id: string;
          city: string;
          country_code: string;
          created_at: string;
          customer_id: string;
          first_name: string;
          label: string;
          last_name: string;
          phone: string;
          postal_code: string;
          street: string;
          suburb: string;
        };
        Insert: {
          address_id?: string;
          city: string;
          country_code?: string;
          created_at?: string;
          customer_id: string;
          first_name: string;
          label?: string;
          last_name: string;
          phone: string;
          postal_code: string;
          street: string;
          suburb?: string;
        };
        Update: {
          address_id?: string;
          city?: string;
          country_code?: string;
          created_at?: string;
          customer_id?: string;
          first_name?: string;
          label?: string;
          last_name?: string;
          phone?: string;
          postal_code?: string;
          street?: string;
          suburb?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_address_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customer";
            referencedColumns: ["customer_id"];
          },
        ];
      };
      newsletter_subscriber: {
        Row: {
          consented_at: string;
          email: string;
          status: string;
          subscriber_id: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          consented_at?: string;
          email: string;
          status?: string;
          subscriber_id?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          consented_at?: string;
          email?: string;
          status?: string;
          subscriber_id?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      order_item: {
        Row: {
          colour_snapshot: string;
          order_id: string;
          order_item_id: string;
          product_name_snapshot: string;
          quantity: number;
          size_snapshot: string;
          sku_snapshot: string;
          tax_rate_snapshot: number;
          unit_price_cents: number;
          variant_id: string;
        };
        Insert: {
          colour_snapshot: string;
          order_id: string;
          order_item_id?: string;
          product_name_snapshot: string;
          quantity: number;
          size_snapshot: string;
          sku_snapshot: string;
          tax_rate_snapshot: number;
          unit_price_cents: number;
          variant_id: string;
        };
        Update: {
          colour_snapshot?: string;
          order_id?: string;
          order_item_id?: string;
          product_name_snapshot?: string;
          quantity?: number;
          size_snapshot?: string;
          sku_snapshot?: string;
          tax_rate_snapshot?: number;
          unit_price_cents?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_item_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "sales_order";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "order_item_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variant";
            referencedColumns: ["variant_id"];
          },
        ];
      };
      payment: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          idempotency_key: string;
          method: string | null;
          order_id: string;
          paid_at: string | null;
          payment_id: string;
          provider: string;
          provider_reference: string | null;
          status: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          idempotency_key: string;
          method?: string | null;
          order_id: string;
          paid_at?: string | null;
          payment_id?: string;
          provider: string;
          provider_reference?: string | null;
          status?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          idempotency_key?: string;
          method?: string | null;
          order_id?: string;
          paid_at?: string | null;
          payment_id?: string;
          provider?: string;
          provider_reference?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "sales_order";
            referencedColumns: ["order_id"];
          },
        ];
      };
      payment_event: {
        Row: {
          event_id: string;
          payment_id: string | null;
          processed_at: string | null;
          provider: string;
          provider_event_id: string;
          received_at: string;
        };
        Insert: {
          event_id?: string;
          payment_id?: string | null;
          processed_at?: string | null;
          provider: string;
          provider_event_id: string;
          received_at?: string;
        };
        Update: {
          event_id?: string;
          payment_id?: string | null;
          processed_at?: string | null;
          provider?: string;
          provider_event_id?: string;
          received_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_event_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payment";
            referencedColumns: ["payment_id"];
          },
        ];
      };
      product: {
        Row: {
          audience: string;
          created_at: string;
          description: string;
          display_order: number;
          fabric_details: string;
          featured_rank: number | null;
          image_fit: string;
          is_active: boolean;
          is_set: boolean;
          name: string;
          product_id: string;
          slug: string;
          subtitle: string;
        };
        Insert: {
          audience: string;
          created_at?: string;
          description?: string;
          display_order?: number;
          fabric_details?: string;
          featured_rank?: number | null;
          image_fit?: string;
          is_active?: boolean;
          is_set?: boolean;
          name: string;
          product_id?: string;
          slug: string;
          subtitle?: string;
        };
        Update: {
          audience?: string;
          created_at?: string;
          description?: string;
          display_order?: number;
          fabric_details?: string;
          featured_rank?: number | null;
          image_fit?: string;
          is_active?: boolean;
          is_set?: boolean;
          name?: string;
          product_id?: string;
          slug?: string;
          subtitle?: string;
        };
        Relationships: [];
      };
      product_colour: {
        Row: {
          colour_name: string;
          display_order: number;
          hex_code: string | null;
          product_colour_id: string;
          product_id: string;
        };
        Insert: {
          colour_name: string;
          display_order?: number;
          hex_code?: string | null;
          product_colour_id?: string;
          product_id: string;
        };
        Update: {
          colour_name?: string;
          display_order?: number;
          hex_code?: string | null;
          product_colour_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_colour_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product";
            referencedColumns: ["product_id"];
          },
        ];
      };
      product_image: {
        Row: {
          alt_text: string;
          display_order: number;
          image_id: string;
          product_colour_id: string;
          storage_path: string;
        };
        Insert: {
          alt_text: string;
          display_order?: number;
          image_id?: string;
          product_colour_id: string;
          storage_path: string;
        };
        Update: {
          alt_text?: string;
          display_order?: number;
          image_id?: string;
          product_colour_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_image_product_colour_id_fkey";
            columns: ["product_colour_id"];
            isOneToOne: false;
            referencedRelation: "product_colour";
            referencedColumns: ["product_colour_id"];
          },
        ];
      };
      product_variant: {
        Row: {
          is_active: boolean;
          price_cents: number;
          product_colour_id: string;
          size_code: string;
          sku: string;
          stock_on_hand: number;
          variant_id: string;
        };
        Insert: {
          is_active?: boolean;
          price_cents: number;
          product_colour_id: string;
          size_code: string;
          sku: string;
          stock_on_hand?: number;
          variant_id?: string;
        };
        Update: {
          is_active?: boolean;
          price_cents?: number;
          product_colour_id?: string;
          size_code?: string;
          sku?: string;
          stock_on_hand?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_product_colour_id_fkey";
            columns: ["product_colour_id"];
            isOneToOne: false;
            referencedRelation: "product_colour";
            referencedColumns: ["product_colour_id"];
          },
        ];
      };
      refund: {
        Row: {
          amount_cents: number;
          idempotency_key: string;
          payment_id: string;
          processed_at: string | null;
          provider_reference: string | null;
          refund_id: string;
          request_id: string | null;
          status: string;
        };
        Insert: {
          amount_cents: number;
          idempotency_key: string;
          payment_id: string;
          processed_at?: string | null;
          provider_reference?: string | null;
          refund_id?: string;
          request_id?: string | null;
          status?: string;
        };
        Update: {
          amount_cents?: number;
          idempotency_key?: string;
          payment_id?: string;
          processed_at?: string | null;
          provider_reference?: string | null;
          refund_id?: string;
          request_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refund_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payment";
            referencedColumns: ["payment_id"];
          },
          {
            foreignKeyName: "refund_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "service_request";
            referencedColumns: ["request_id"];
          },
        ];
      };
      sales_order: {
        Row: {
          cart_id: string | null;
          city_snapshot: string;
          country_code: string;
          currency: string;
          customer_id: string | null;
          email_snapshot: string;
          first_name_snapshot: string;
          last_name_snapshot: string;
          order_id: string;
          order_number: string;
          phone_snapshot: string;
          placed_at: string;
          postal_code_snapshot: string;
          shipping_cents: number;
          status: string;
          street_snapshot: string;
          subtotal_cents: number;
          suburb_snapshot: string;
          tax_included_cents: number;
          total_cents: number;
        };
        Insert: {
          cart_id?: string | null;
          city_snapshot: string;
          country_code?: string;
          currency?: string;
          customer_id?: string | null;
          email_snapshot: string;
          first_name_snapshot: string;
          last_name_snapshot: string;
          order_id?: string;
          order_number: string;
          phone_snapshot: string;
          placed_at?: string;
          postal_code_snapshot: string;
          shipping_cents: number;
          status?: string;
          street_snapshot: string;
          subtotal_cents: number;
          suburb_snapshot?: string;
          tax_included_cents: number;
          total_cents: number;
        };
        Update: {
          cart_id?: string | null;
          city_snapshot?: string;
          country_code?: string;
          currency?: string;
          customer_id?: string | null;
          email_snapshot?: string;
          first_name_snapshot?: string;
          last_name_snapshot?: string;
          order_id?: string;
          order_number?: string;
          phone_snapshot?: string;
          placed_at?: string;
          postal_code_snapshot?: string;
          shipping_cents?: number;
          status?: string;
          street_snapshot?: string;
          subtotal_cents?: number;
          suburb_snapshot?: string;
          tax_included_cents?: number;
          total_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_order_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: true;
            referencedRelation: "cart";
            referencedColumns: ["cart_id"];
          },
          {
            foreignKeyName: "sales_order_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customer";
            referencedColumns: ["customer_id"];
          },
        ];
      };
      service_request: {
        Row: {
          inbound_tracking: string | null;
          order_item_id: string;
          outbound_tracking: string | null;
          quantity: number;
          reason: string;
          received_at: string | null;
          replacement_variant_id: string | null;
          request_id: string;
          request_type: string;
          requested_at: string;
          status: string;
        };
        Insert: {
          inbound_tracking?: string | null;
          order_item_id: string;
          outbound_tracking?: string | null;
          quantity: number;
          reason: string;
          received_at?: string | null;
          replacement_variant_id?: string | null;
          request_id?: string;
          request_type: string;
          requested_at?: string;
          status?: string;
        };
        Update: {
          inbound_tracking?: string | null;
          order_item_id?: string;
          outbound_tracking?: string | null;
          quantity?: number;
          reason?: string;
          received_at?: string | null;
          replacement_variant_id?: string | null;
          request_id?: string;
          request_type?: string;
          requested_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_request_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_item";
            referencedColumns: ["order_item_id"];
          },
          {
            foreignKeyName: "service_request_replacement_variant_id_fkey";
            columns: ["replacement_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variant";
            referencedColumns: ["variant_id"];
          },
        ];
      };
      shipment: {
        Row: {
          courier: string;
          delivered_at: string | null;
          order_id: string;
          shipment_id: string;
          shipped_at: string | null;
          status: string;
          tracking_number: string | null;
        };
        Insert: {
          courier: string;
          delivered_at?: string | null;
          order_id: string;
          shipment_id?: string;
          shipped_at?: string | null;
          status?: string;
          tracking_number?: string | null;
        };
        Update: {
          courier?: string;
          delivered_at?: string | null;
          order_id?: string;
          shipment_id?: string;
          shipped_at?: string | null;
          status?: string;
          tracking_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "sales_order";
            referencedColumns: ["order_id"];
          },
        ];
      };
      stock_reservation: {
        Row: {
          expires_at: string;
          order_id: string;
          quantity: number;
          reservation_id: string;
          status: string;
          variant_id: string;
        };
        Insert: {
          expires_at: string;
          order_id: string;
          quantity: number;
          reservation_id?: string;
          status?: string;
          variant_id: string;
        };
        Update: {
          expires_at?: string;
          order_id?: string;
          quantity?: number;
          reservation_id?: string;
          status?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_reservation_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "sales_order";
            referencedColumns: ["order_id"];
          },
          {
            foreignKeyName: "stock_reservation_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variant";
            referencedColumns: ["variant_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_pending_order: {
        Args: {
          p_address: Json;
          p_cart_id: string;
          p_customer_id: string;
          p_token_hash: string;
        };
        Returns: string;
      };
      manage_cart: {
        Args: {
          p_customer_id: string;
          p_import?: Json;
          p_operation: string;
          p_quantity?: number;
          p_token_hash: string;
          p_variant_id?: string;
        };
        Returns: Json;
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
