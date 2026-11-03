export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atelier_artisans: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          location: string | null
          orders_completed: number
          portfolio_images: string[]
          price_range: Json
          rating: number
          specialty: string[]
          store_name: string
          trust_score: number
          turnaround_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          location?: string | null
          orders_completed?: number
          portfolio_images?: string[]
          price_range?: Json
          rating?: number
          specialty?: string[]
          store_name: string
          trust_score?: number
          turnaround_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          location?: string | null
          orders_completed?: number
          portfolio_images?: string[]
          price_range?: Json
          rating?: number
          specialty?: string[]
          store_name?: string
          trust_score?: number
          turnaround_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atelier_artisans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      atelier_measurements: {
        Row: {
          ankle: number | null
          arm_length: number | null
          armhole: number | null
          back_waist_length: number | null
          bicep: number | null
          body_type: string
          calf: number | null
          chest: number | null
          created_at: string
          crotch_depth: number | null
          elbow: number | null
          fit_preference: string
          front_waist_length: number | null
          garment_type: string
          gender: string
          gown_length: number | null
          head: number | null
          height: number | null
          high_hip: number | null
          hips: number | null
          id: string
          inseam: number | null
          is_default: boolean
          knee: number | null
          label: string
          measurement_data: Json
          measurement_method: string
          measurement_notes: string | null
          measurement_units: string
          measurement_verified: boolean
          neck: number | null
          notes: string | null
          outfit_length: number | null
          outseam: number | null
          posture_notes: string | null
          rise_back: number | null
          rise_front: number | null
          shirt_length: number | null
          shoulder: number | null
          shoulder_to_floor: number | null
          skirt_length: number | null
          sleeve: number | null
          source: string
          thigh: number | null
          underbust: number | null
          unit: string
          updated_at: string
          user_id: string
          waist: number | null
          waist_to_floor: number | null
          wrist: number | null
        }
        Insert: {
          ankle?: number | null
          arm_length?: number | null
          armhole?: number | null
          back_waist_length?: number | null
          bicep?: number | null
          body_type?: string
          calf?: number | null
          chest?: number | null
          created_at?: string
          crotch_depth?: number | null
          elbow?: number | null
          fit_preference?: string
          front_waist_length?: number | null
          garment_type?: string
          gender?: string
          gown_length?: number | null
          head?: number | null
          height?: number | null
          high_hip?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          is_default?: boolean
          knee?: number | null
          label?: string
          measurement_data?: Json
          measurement_method?: string
          measurement_notes?: string | null
          measurement_units?: string
          measurement_verified?: boolean
          neck?: number | null
          notes?: string | null
          outfit_length?: number | null
          outseam?: number | null
          posture_notes?: string | null
          rise_back?: number | null
          rise_front?: number | null
          shirt_length?: number | null
          shoulder?: number | null
          shoulder_to_floor?: number | null
          skirt_length?: number | null
          sleeve?: number | null
          source?: string
          thigh?: number | null
          underbust?: number | null
          unit?: string
          updated_at?: string
          user_id: string
          waist?: number | null
          waist_to_floor?: number | null
          wrist?: number | null
        }
        Update: {
          ankle?: number | null
          arm_length?: number | null
          armhole?: number | null
          back_waist_length?: number | null
          bicep?: number | null
          body_type?: string
          calf?: number | null
          chest?: number | null
          created_at?: string
          crotch_depth?: number | null
          elbow?: number | null
          fit_preference?: string
          front_waist_length?: number | null
          garment_type?: string
          gender?: string
          gown_length?: number | null
          head?: number | null
          height?: number | null
          high_hip?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          is_default?: boolean
          knee?: number | null
          label?: string
          measurement_data?: Json
          measurement_method?: string
          measurement_notes?: string | null
          measurement_units?: string
          measurement_verified?: boolean
          neck?: number | null
          notes?: string | null
          outfit_length?: number | null
          outseam?: number | null
          posture_notes?: string | null
          rise_back?: number | null
          rise_front?: number | null
          shirt_length?: number | null
          shoulder?: number | null
          shoulder_to_floor?: number | null
          skirt_length?: number | null
          sleeve?: number | null
          source?: string
          thigh?: number | null
          underbust?: number | null
          unit?: string
          updated_at?: string
          user_id?: string
          waist?: number | null
          waist_to_floor?: number | null
          wrist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atelier_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      atelier_orders: {
        Row: {
          ai_suggestions: Json
          ankle: number | null
          arm_length: number | null
          artisan_id: string | null
          body_type: string | null
          bust_chest: number | null
          color: string | null
          created_at: string
          deposit_paid: number
          estimated_delivery: string | null
          fabric: string | null
          fit_preference: string | null
          garment_type: string
          gender: string
          hips: number | null
          id: string
          inseam: number | null
          length: number | null
          measurement_method: string
          measurement_profile_id: string | null
          measurement_snapshot: Json
          measurement_unit: string
          measurement_units: string
          neck: number | null
          occasion: string | null
          price_quote: number | null
          reference_images: string[]
          serial_number: string
          shoulder: number | null
          sleeve_length: number | null
          special_instructions: string | null
          status: string
          thigh: number | null
          updated_at: string
          user_id: string
          waist: number | null
        }
        Insert: {
          ai_suggestions?: Json
          ankle?: number | null
          arm_length?: number | null
          artisan_id?: string | null
          body_type?: string | null
          bust_chest?: number | null
          color?: string | null
          created_at?: string
          deposit_paid?: number
          estimated_delivery?: string | null
          fabric?: string | null
          fit_preference?: string | null
          garment_type: string
          gender: string
          hips?: number | null
          id?: string
          inseam?: number | null
          length?: number | null
          measurement_method?: string
          measurement_profile_id?: string | null
          measurement_snapshot?: Json
          measurement_unit?: string
          measurement_units?: string
          neck?: number | null
          occasion?: string | null
          price_quote?: number | null
          reference_images?: string[]
          serial_number?: string
          shoulder?: number | null
          sleeve_length?: number | null
          special_instructions?: string | null
          status?: string
          thigh?: number | null
          updated_at?: string
          user_id: string
          waist?: number | null
        }
        Update: {
          ai_suggestions?: Json
          ankle?: number | null
          arm_length?: number | null
          artisan_id?: string | null
          body_type?: string | null
          bust_chest?: number | null
          color?: string | null
          created_at?: string
          deposit_paid?: number
          estimated_delivery?: string | null
          fabric?: string | null
          fit_preference?: string | null
          garment_type?: string
          gender?: string
          hips?: number | null
          id?: string
          inseam?: number | null
          length?: number | null
          measurement_method?: string
          measurement_profile_id?: string | null
          measurement_snapshot?: Json
          measurement_unit?: string
          measurement_units?: string
          neck?: number | null
          occasion?: string | null
          price_quote?: number | null
          reference_images?: string[]
          serial_number?: string
          shoulder?: number | null
          sleeve_length?: number | null
          special_instructions?: string | null
          status?: string
          thigh?: number | null
          updated_at?: string
          user_id?: string
          waist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atelier_orders_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atelier_orders_measurement_profile_id_fkey"
            columns: ["measurement_profile_id"]
            isOneToOne: false
            referencedRelation: "atelier_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atelier_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          auto_max: number | null
          bidder_id: string
          created_at: string
          id: string
          is_auto: boolean
        }
        Insert: {
          amount: number
          auction_id: string
          auto_max?: number | null
          bidder_id: string
          created_at?: string
          id?: string
          is_auto?: boolean
        }
        Update: {
          amount?: number
          auction_id?: string
          auto_max?: number | null
          bidder_id?: string
          created_at?: string
          id?: string
          is_auto?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          anti_snipe_extension: number
          bid_count: number
          category: string
          created_at: string
          current_bid: number
          current_bidder_id: string | null
          description: string | null
          end_time: string
          final_price: number | null
          gallery_urls: string[]
          id: string
          image_url: string | null
          reserve_price: number | null
          seller_id: string | null
          start_time: string
          starting_bid: number
          status: string
          title: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          anti_snipe_extension?: number
          bid_count?: number
          category?: string
          created_at?: string
          current_bid?: number
          current_bidder_id?: string | null
          description?: string | null
          end_time: string
          final_price?: number | null
          gallery_urls?: string[]
          id?: string
          image_url?: string | null
          reserve_price?: number | null
          seller_id?: string | null
          start_time: string
          starting_bid: number
          status?: string
          title: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          anti_snipe_extension?: number
          bid_count?: number
          category?: string
          created_at?: string
          current_bid?: number
          current_bidder_id?: string | null
          description?: string | null
          end_time?: string
          final_price?: number | null
          gallery_urls?: string[]
          id?: string
          image_url?: string | null
          reserve_price?: number | null
          seller_id?: string | null
          start_time?: string
          starting_bid?: number
          status?: string
          title?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_current_bidder_id_fkey"
            columns: ["current_bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          asset_ids: string[]
          author_id: string
          body: string
          comments_count: number
          created_at: string
          id: string
          likes_count: number
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          asset_ids?: string[]
          author_id: string
          body: string
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          asset_ids?: string[]
          author_id?: string
          body?: string
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drops: {
        Row: {
          cover_asset_id: string | null
          created_at: string
          description: string | null
          drop_type: string
          end_time: string
          id: string
          is_featured: boolean
          minimum_tier: string
          name: string
          price: number
          product_id: string | null
          start_time: string
          status: string
          stock: number
          translations: Json
          units_sold: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          cover_asset_id?: string | null
          created_at?: string
          description?: string | null
          drop_type?: string
          end_time: string
          id?: string
          is_featured?: boolean
          minimum_tier?: string
          name: string
          price: number
          product_id?: string | null
          start_time: string
          status?: string
          stock?: number
          translations?: Json
          units_sold?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          cover_asset_id?: string | null
          created_at?: string
          description?: string | null
          drop_type?: string
          end_time?: string
          id?: string
          is_featured?: boolean
          minimum_tier?: string
          name?: string
          price?: number
          product_id?: string | null
          start_time?: string
          status?: string
          stock?: number
          translations?: Json
          units_sold?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drops_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drops_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drops_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          order_id: string | null
          request_id: string | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          order_id?: string | null
          request_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          order_id?: string | null
          request_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_audit_log_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reconciliations: {
        Row: {
          actual_amount: number
          actual_currency: string
          created_at: string
          created_by: string | null
          details: Json
          expected_amount: number
          expected_currency: string
          external_event_id: string | null
          id: string
          payment_transaction_id: string | null
          provider: string
          provider_reference: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          actual_amount: number
          actual_currency: string
          created_at?: string
          created_by?: string | null
          details?: Json
          expected_amount: number
          expected_currency: string
          external_event_id?: string | null
          id?: string
          payment_transaction_id?: string | null
          provider: string
          provider_reference?: string | null
          resolved_at?: string | null
          status: string
        }
        Update: {
          actual_amount?: number
          actual_currency?: string
          created_at?: string
          created_by?: string | null
          details?: Json
          expected_amount?: number
          expected_currency?: string
          external_event_id?: string | null
          id?: string
          payment_transaction_id?: string | null
          provider?: string
          provider_reference?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reconciliations_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          metadata: Json
          order_id: string
          payment_transaction_id: string
          processed_at: string | null
          provider: string
          provider_reference: string
          reason: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency: string
          id?: string
          metadata?: Json
          order_id: string
          payment_transaction_id: string
          processed_at?: string | null
          provider: string
          provider_reference: string
          reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string
          payment_transaction_id?: string
          processed_at?: string | null
          provider?: string
          provider_reference?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_refunds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_refunds_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      heritage_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_asset_id: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          read_time_min: number | null
          slug: string | null
          tags: string[]
          title: string
          translations: Json
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          cover_asset_id?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_min?: number | null
          slug?: string | null
          tags?: string[]
          title: string
          translations?: Json
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_asset_id?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          read_time_min?: number | null
          slug?: string | null
          tags?: string[]
          title?: string
          translations?: Json
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "heritage_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heritage_posts_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      heritage_youtube_items: {
        Row: {
          ai_enrichment: Json
          channel_handle: string
          channel_id: string | null
          created_at: string
          description: string
          id: string
          program: string
          published_at: string | null
          status: string
          tags: string[]
          thumbnail_url: string | null
          title: string
          translations: Json
          updated_at: string
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          ai_enrichment?: Json
          channel_handle?: string
          channel_id?: string | null
          created_at?: string
          description?: string
          id?: string
          program?: string
          published_at?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          translations?: Json
          updated_at?: string
          youtube_id: string
          youtube_url: string
        }
        Update: {
          ai_enrichment?: Json
          channel_handle?: string
          channel_id?: string | null
          created_at?: string
          description?: string
          id?: string
          program?: string
          published_at?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          translations?: Json
          updated_at?: string
          youtube_id?: string
          youtube_url?: string
        }
        Relationships: []
      }
      heritage_youtube_sync_state: {
        Row: {
          channel_handle: string
          channel_id: string | null
          id: boolean
          last_result: Json
          last_sync_at: string | null
          updated_at: string
        }
        Insert: {
          channel_handle?: string
          channel_id?: string | null
          id?: boolean
          last_result?: Json
          last_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          channel_handle?: string
          channel_id?: string | null
          id?: boolean
          last_result?: Json
          last_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          quantity_delta: number
          reason: string
          reference_id: string | null
          variant_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          quantity_delta: number
          reason: string
          reference_id?: string | null
          variant_id?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          quantity_delta?: number
          reason?: string
          reference_id?: string | null
          variant_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lee_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lee_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lee_voucher_campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          name: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          name: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lee_voucher_redemptions: {
        Row: {
          campaign_id: string
          id: string
          lee_amount: number
          redeemed_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          lee_amount: number
          redeemed_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          lee_amount?: number
          redeemed_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lee_voucher_redemptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lee_voucher_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lee_voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "lee_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      lee_vouchers: {
        Row: {
          campaign_id: string
          code_hash: string
          code_hint: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          lee_amount: number
          max_redemptions: number
          redemption_count: number
          starts_at: string
          status: string
        }
        Insert: {
          campaign_id: string
          code_hash: string
          code_hint: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          lee_amount: number
          max_redemptions?: number
          redemption_count?: number
          starts_at?: string
          status?: string
        }
        Update: {
          campaign_id?: string
          code_hash?: string
          code_hint?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          lee_amount?: number
          max_redemptions?: number
          redemption_count?: number
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lee_vouchers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "lee_voucher_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_agent_actions: {
        Row: {
          action: string
          agent: string
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          input: Json
          model: string | null
          output: Json | null
          request_id: string | null
          success: boolean
          tool_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          agent?: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: Json
          model?: string | null
          output?: Json | null
          request_id?: string | null
          success?: boolean
          tool_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          agent?: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input?: Json
          model?: string | null
          output?: Json | null
          request_id?: string | null
          success?: boolean
          tool_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leema_agent_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "leema_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_conversations: {
        Row: {
          channel: string
          created_at: string
          id: string
          language: string
          last_message_at: string | null
          metadata: Json
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          language?: string
          last_message_at?: string | null
          metadata?: Json
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          language?: string
          last_message_at?: string | null
          metadata?: Json
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leema_escalations: {
        Row: {
          assigned_to: string | null
          context: Json
          conversation_id: string | null
          created_at: string
          id: string
          priority: string
          reason: string
          resolved_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          context?: Json
          conversation_id?: string | null
          created_at?: string
          id?: string
          priority?: string
          reason: string
          resolved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          context?: Json
          conversation_id?: string | null
          created_at?: string
          id?: string
          priority?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leema_escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "leema_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_feedback: {
        Row: {
          conversation_id: string | null
          created_at: string
          feedback: string | null
          id: string
          message_id: string | null
          metadata: Json
          rating: number | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leema_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "leema_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leema_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "leema_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          id: string
          metadata: Json
          search_text: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json
          search_text?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json
          search_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leema_knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leema_knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_knowledge_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          language: string
          metadata: Json
          source_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          language?: string
          metadata?: Json
          source_id?: string | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          language?: string
          metadata?: Json
          source_id?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leema_memory: {
        Row: {
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          key: string
          memory_type: string
          source: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          memory_type: string
          source?: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          memory_type?: string
          source?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      leema_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          model: string | null
          role: string
          structured_response: Json | null
          tokens_in: number | null
          tokens_out: number | null
          tool_arguments: Json | null
          tool_call_id: string | null
          tool_name: string | null
          tool_result: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          model?: string | null
          role: string
          structured_response?: Json | null
          tokens_in?: number | null
          tokens_out?: number | null
          tool_arguments?: Json | null
          tool_call_id?: string | null
          tool_name?: string | null
          tool_result?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          model?: string | null
          role?: string
          structured_response?: Json | null
          tokens_in?: number | null
          tokens_out?: number | null
          tool_arguments?: Json | null
          tool_call_id?: string | null
          tool_name?: string | null
          tool_result?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leema_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "leema_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_tool_calls: {
        Row: {
          arguments: Json
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          request_id: string | null
          result: Json | null
          status: string
          tool_name: string
          user_id: string | null
        }
        Insert: {
          arguments?: Json
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          request_id?: string | null
          result?: Json | null
          status?: string
          tool_name: string
          user_id?: string | null
        }
        Update: {
          arguments?: Json
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          request_id?: string | null
          result?: Json | null
          status?: string
          tool_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leema_tool_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "leema_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leema_tool_registry: {
        Row: {
          allowed_roles: string[]
          category: string
          created_at: string
          description: string
          enabled: boolean
          id: string
          input_schema: Json
          requires_confirmation: boolean
          tool_name: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: string[]
          category: string
          created_at?: string
          description: string
          enabled?: boolean
          id?: string
          input_schema: Json
          requires_confirmation?: boolean
          tool_name: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: string[]
          category?: string
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          input_schema?: Json
          requires_confirmation?: boolean
          tool_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leema_webhook_events: {
        Row: {
          completed_at: string | null
          error_message: string | null
          event_type: string
          id: string
          idempotency_key: string
          received_at: string
          request_hash: string | null
          request_id: string
          response_payload: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          idempotency_key: string
          received_at?: string
          request_hash?: string | null
          request_id: string
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          idempotency_key?: string
          received_at?: string
          request_hash?: string | null
          request_id?: string
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          asset_type: string
          bytes: number | null
          created_at: string
          duration: number | null
          entity_id: string | null
          entity_type: string | null
          folder: string | null
          format: string | null
          height: number | null
          id: string
          metadata: Json
          owner_id: string
          provider: string
          public_id: string | null
          resource_type: string
          secure_url: string
          status: string
          updated_at: string
          vendor_id: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          asset_type: string
          bytes?: number | null
          created_at?: string
          duration?: number | null
          entity_id?: string | null
          entity_type?: string | null
          folder?: string | null
          format?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          owner_id: string
          provider?: string
          public_id?: string | null
          resource_type?: string
          secure_url: string
          status?: string
          updated_at?: string
          vendor_id?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          asset_type?: string
          bytes?: number | null
          created_at?: string
          duration?: number | null
          entity_id?: string | null
          entity_type?: string | null
          folder?: string | null
          format?: string | null
          height?: number | null
          id?: string
          metadata?: Json
          owner_id?: string
          provider?: string
          public_id?: string | null
          resource_type?: string
          secure_url?: string
          status?: string
          updated_at?: string
          vendor_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_posts: {
        Row: {
          asset_ids: string[]
          author_id: string | null
          caption: string | null
          created_at: string
          external_url: string | null
          id: string
          likes_count: number
          media_type: string
          published_at: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          asset_ids?: string[]
          author_id?: string | null
          caption?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          likes_count?: number
          media_type: string
          published_at?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          asset_ids?: string[]
          author_id?: string | null
          caption?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          likes_count?: number
          media_type?: string
          published_at?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image_snapshot: string | null
          metadata: Json
          name_snapshot: string
          order_id: string
          product_id: string | null
          quantity: number
          size: string | null
          unit_price: number
          variant_id: string | null
          vendor_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image_snapshot?: string | null
          metadata?: Json
          name_snapshot: string
          order_id: string
          product_id?: string | null
          quantity: number
          size?: string | null
          unit_price: number
          variant_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image_snapshot?: string | null
          metadata?: Json
          name_snapshot?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          size?: string | null
          unit_price?: number
          variant_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          currency: string
          delivery_fee: number
          id: string
          inventory_released_at: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string
          reservation_expires_at: string | null
          shipping_address: Json
          status: string
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          currency?: string
          delivery_fee?: number
          id?: string
          inventory_released_at?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          reservation_expires_at?: string | null
          shipping_address?: Json
          status?: string
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          currency?: string
          delivery_fee?: number
          id?: string
          inventory_released_at?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          reservation_expires_at?: string | null
          shipping_address?: Json
          status?: string
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fee_currency: string | null
          id: string
          metadata: Json
          order_id: string | null
          paid_at: string | null
          provider: string
          provider_event_id: string | null
          provider_fee: number
          provider_fee_source: string
          provider_reference: string | null
          reconciled_at: string | null
          reconciliation_status: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fee_currency?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          provider: string
          provider_event_id?: string | null
          provider_fee?: number
          provider_fee_source?: string
          provider_reference?: string | null
          reconciled_at?: string | null
          reconciliation_status?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fee_currency?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_event_id?: string | null
          provider_fee?: number
          provider_fee_source?: string
          provider_reference?: string | null
          reconciled_at?: string | null
          reconciliation_status?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_finance_configs: {
        Row: {
          active: boolean
          commission_rate: number
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_until: string | null
          id: string
          metadata: Json
          payout_minimum: number
          provider_fee_fixed: number | null
          provider_fee_percent: number | null
          settlement_delay_days: number
          version: number
        }
        Insert: {
          active?: boolean
          commission_rate: number
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          metadata?: Json
          payout_minimum?: number
          provider_fee_fixed?: number | null
          provider_fee_percent?: number | null
          settlement_delay_days?: number
          version?: never
        }
        Update: {
          active?: boolean
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          metadata?: Json
          payout_minimum?: number
          provider_fee_fixed?: number | null
          provider_fee_percent?: number | null
          settlement_delay_days?: number
          version?: never
        }
        Relationships: [
          {
            foreignKeyName: "platform_finance_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_finance_ledger: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          metadata: Json
          order_id: string | null
          payment_transaction_id: string | null
          reference_key: string
          status: string
          type: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string | null
          payment_transaction_id?: string | null
          reference_key: string
          status?: string
          type: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string | null
          payment_transaction_id?: string | null
          reference_key?: string
          status?: string
          type?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_finance_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_finance_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_finance_ledger_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_finance_ledger_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          asset_id: string | null
          created_at: string
          id: string
          is_primary: boolean
          media_type: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          asset_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          asset_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          color: string | null
          created_at: string
          id: string
          material: string | null
          price_override: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          color?: string | null
          created_at?: string
          id?: string
          material?: string | null
          price_override?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          color?: string | null
          created_at?: string
          id?: string
          material?: string | null
          price_override?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_instructions: string | null
          category: string
          colors: string[]
          created_at: string
          currency: string
          description: string | null
          id: string
          is_featured: boolean
          low_stock_threshold: number
          material: string | null
          name: string
          orders_count: number
          origin: string | null
          original_price: number | null
          price: number
          published_at: string | null
          rating: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seo: Json
          short_description: string | null
          sizes: string[]
          slug: string
          status: string
          stock: number
          sub_category: string | null
          tags: string[]
          translations: Json
          updated_at: string
          vendor_id: string
          views_count: number
        }
        Insert: {
          care_instructions?: string | null
          category: string
          colors?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          low_stock_threshold?: number
          material?: string | null
          name: string
          orders_count?: number
          origin?: string | null
          original_price?: number | null
          price: number
          published_at?: string | null
          rating?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seo?: Json
          short_description?: string | null
          sizes?: string[]
          slug: string
          status?: string
          stock?: number
          sub_category?: string | null
          tags?: string[]
          translations?: Json
          updated_at?: string
          vendor_id: string
          views_count?: number
        }
        Update: {
          care_instructions?: string | null
          category?: string
          colors?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          low_stock_threshold?: number
          material?: string | null
          name?: string
          orders_count?: number
          origin?: string | null
          original_price?: number | null
          price?: number
          published_at?: string | null
          rating?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seo?: Json
          short_description?: string | null
          sizes?: string[]
          slug?: string
          status?: string
          stock?: number
          sub_category?: string | null
          tags?: string[]
          translations?: Json
          updated_at?: string
          vendor_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          cultural_interests: string[]
          display_name: string | null
          firebase_uid: string | null
          id: string
          lee_balance: number
          lee_lifetime_earned: number
          lee_lifetime_spent: number
          preferred_language: string
          prestige_tier: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cultural_interests?: string[]
          display_name?: string | null
          firebase_uid?: string | null
          id: string
          lee_balance?: number
          lee_lifetime_earned?: number
          lee_lifetime_spent?: number
          preferred_language?: string
          prestige_tier?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cultural_interests?: string[]
          display_name?: string | null
          firebase_uid?: string | null
          id?: string
          lee_balance?: number
          lee_lifetime_earned?: number
          lee_lifetime_spent?: number
          preferred_language?: string
          prestige_tier?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          asset_ids: string[]
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          is_verified_purchase: boolean
          order_id: string | null
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          asset_ids?: string[]
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          asset_ids?: string[]
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_materials: {
        Row: {
          asset_ids: string[]
          created_at: string
          description: string | null
          external_links: string[]
          id: string
          material_type: string
          metadata: Json
          product_ids: string[]
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          asset_ids?: string[]
          created_at?: string
          description?: string | null
          external_links?: string[]
          id?: string
          material_type: string
          metadata?: Json
          product_ids?: string[]
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          asset_ids?: string[]
          created_at?: string
          description?: string | null
          external_links?: string[]
          id?: string
          material_type?: string
          metadata?: Json
          product_ids?: string[]
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_materials_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          id: string
          lee_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          lee_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          lee_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_applications: {
        Row: {
          bio: string | null
          business_name: string
          created_at: string
          id: string
          location: string | null
          phone: string | null
          portfolio_urls: string[]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string | null
          social_links: Json
          specialization: string[]
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_name: string
          created_at?: string
          id?: string
          location?: string | null
          phone?: string | null
          portfolio_urls?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string | null
          social_links?: Json
          specialization?: string[]
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_name?: string
          created_at?: string
          id?: string
          location?: string | null
          phone?: string | null
          portfolio_urls?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string | null
          social_links?: Json
          specialization?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_followers: {
        Row: {
          created_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_followers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_ledger: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          metadata: Json
          order_id: string | null
          order_item_id: string | null
          status: string
          type: string
          vendor_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          order_item_id?: string | null
          status?: string
          type: string
          vendor_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          order_item_id?: string | null
          status?: string
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          currency: string
          destination: Json
          failure_reason: string | null
          id: string
          ledger_entry_id: string | null
          metadata: Json
          processed_at: string | null
          provider: string | null
          provider_reference: string | null
          requested_at: string
          status: string
          vendor_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          currency?: string
          destination?: Json
          failure_reason?: string | null
          id?: string
          ledger_entry_id?: string | null
          metadata?: Json
          processed_at?: string | null
          provider?: string | null
          provider_reference?: string | null
          requested_at?: string
          status?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          currency?: string
          destination?: Json
          failure_reason?: string | null
          id?: string
          ledger_entry_id?: string | null
          metadata?: Json
          processed_at?: string | null
          provider?: string | null
          provider_reference?: string | null
          requested_at?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payouts_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "vendor_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          location: string | null
          logo_url: string | null
          products_count: number
          rating: number
          slug: string
          social_links: Json
          specialization: string[]
          status: string
          store_name: string
          total_revenue: number
          total_sales: number
          translations: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          location?: string | null
          logo_url?: string | null
          products_count?: number
          rating?: number
          slug: string
          social_links?: Json
          specialization?: string[]
          status?: string
          store_name: string
          total_revenue?: number
          total_sales?: number
          translations?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          location?: string | null
          logo_url?: string | null
          products_count?: number
          rating?: number
          slug?: string
          social_links?: Json
          specialization?: string[]
          status?: string
          store_name?: string
          total_revenue?: number
          total_sales?: number
          translations?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_vendor_application: {
        Args: {
          p_application_id: string
          p_description?: string
          p_location?: string
          p_slug: string
          p_specialization?: string[]
          p_store_name: string
        }
        Returns: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          location: string | null
          logo_url: string | null
          products_count: number
          rating: number
          slug: string
          social_links: Json
          specialization: string[]
          status: string
          store_name: string
          total_revenue: number
          total_sales: number
          translations: Json
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vendor_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_lee: {
        Args: {
          p_amount: number
          p_description?: string
          p_event_type: string
          p_metadata?: Json
          p_reference_id?: string
          p_user_id: string
        }
        Returns: {
          id: string
          lee_balance: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_unpaid_marketplace_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      confirm_order_payment: {
        Args: {
          p_metadata?: Json
          p_provider: string
          p_provider_reference: string
          p_status: string
        }
        Returns: {
          amount: number
          created_at: string
          currency: string
          fee_currency: string | null
          id: string
          metadata: Json
          order_id: string | null
          paid_at: string | null
          provider: string
          provider_event_id: string | null
          provider_fee: number
          provider_fee_source: string
          provider_reference: string | null
          reconciled_at: string | null
          reconciliation_status: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_checkout_order: {
        Args: {
          p_delivery_fee?: number
          p_items: Json
          p_notes?: string
          p_payment_method?: string
          p_shipping_address: Json
          p_user_id: string
        }
        Returns: Json
      }
      ensure_firebase_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          cultural_interests: string[]
          display_name: string | null
          firebase_uid: string | null
          id: string
          lee_balance: number
          lee_lifetime_earned: number
          lee_lifetime_spent: number
          preferred_language: string
          prestige_tier: string
          role: string
          updated_at: string
          username: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leema_search_knowledge: {
        Args: { p_category?: string; p_limit?: number; p_query: string }
        Returns: {
          category: string
          content: string
          document_id: string
          id: string
          rank: number
          title: string
        }[]
      }
      moderate_vendor_application: {
        Args: { p_action: string; p_application_id: string; p_note?: string }
        Returns: Json
      }
      place_auction_bid: {
        Args: { p_amount: number; p_auction_id: string }
        Returns: {
          amount: number
          auction_id: string
          auto_max: number | null
          bidder_id: string
          created_at: string
          id: string
          is_auto: boolean
        }
        SetofOptions: {
          from: "*"
          to: "auction_bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      process_vendor_payout: {
        Args: {
          p_failure_reason?: string
          p_metadata?: Json
          p_payout_id: string
          p_provider_reference?: string
          p_status: string
        }
        Returns: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          currency: string
          destination: Json
          failure_reason: string | null
          id: string
          ledger_entry_id: string | null
          metadata: Json
          processed_at: string | null
          provider: string | null
          provider_reference: string | null
          requested_at: string
          status: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vendor_payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reconcile_payment: {
        Args: {
          p_actual_amount: number
          p_actual_currency: string
          p_details?: Json
          p_external_event_id: string
          p_payment_transaction_id: string
          p_provider: string
          p_provider_reference: string
        }
        Returns: {
          actual_amount: number
          actual_currency: string
          created_at: string
          created_by: string | null
          details: Json
          expected_amount: number
          expected_currency: string
          external_event_id: string | null
          id: string
          payment_transaction_id: string | null
          provider: string
          provider_reference: string | null
          resolved_at: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "financial_reconciliations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_order_refund: {
        Args: {
          p_amount: number
          p_currency: string
          p_metadata?: Json
          p_order_id: string
          p_payment_transaction_id: string
          p_provider: string
          p_provider_reference: string
          p_reason?: string
        }
        Returns: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          metadata: Json
          order_id: string
          payment_transaction_id: string
          processed_at: string | null
          provider: string
          provider_reference: string
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "financial_refunds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_lee_voucher: { Args: { p_code: string }; Returns: Json }
      release_expired_marketplace_reservations: {
        Args: { p_limit?: number }
        Returns: Json
      }
      request_vendor_payout: {
        Args: {
          p_amount: number
          p_currency?: string
          p_metadata?: Json
          p_vendor_id: string
        }
        Returns: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          currency: string
          destination: Json
          failure_reason: string | null
          id: string
          ledger_entry_id: string | null
          metadata: Json
          processed_at: string | null
          provider: string | null
          provider_reference: string | null
          requested_at: string
          status: string
          vendor_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vendor_payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_platform_finance_config: {
        Args: {
          p_commission_rate: number
          p_currency: string
          p_metadata?: Json
          p_payout_minimum?: number
          p_provider_fee_fixed?: number
          p_provider_fee_percent?: number
          p_settlement_delay_days?: number
        }
        Returns: {
          active: boolean
          commission_rate: number
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_until: string | null
          id: string
          metadata: Json
          payout_minimum: number
          provider_fee_fixed: number | null
          provider_fee_percent: number | null
          settlement_delay_days: number
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "platform_finance_configs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      settle_order_financials: {
        Args: { p_order_id: string; p_payment_transaction_id: string }
        Returns: string
      }
      submit_atelier_commission: {
        Args: {
          p_body_type?: string
          p_color?: string
          p_fabric?: string
          p_fit_preference?: string
          p_garment_type: string
          p_gender: string
          p_measurement_notes?: string
          p_measurements: Json
          p_occasion?: string
          p_posture_notes?: string
          p_special_instructions?: string
          p_unit: string
        }
        Returns: {
          measurement_profile_id: string
          order_id: string
          serial_number: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
