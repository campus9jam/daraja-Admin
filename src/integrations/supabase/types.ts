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
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          payload: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          agent: string | null
          context: Json | null
          created_at: string
          id: string
          is_archived: boolean | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          message_id: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          event: string
          id: string
          level: string | null
          payload: Json | null
          user_id: string | null
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event: string
          id?: string
          level?: string | null
          payload?: Json | null
          user_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event?: string
          id?: string
          level?: string | null
          payload?: Json | null
          user_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          model: string | null
          role: string
          tokens: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          role: string
          tokens?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          role?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          payload: Json
          recommendation_type: string
          score: number | null
          user_id: string | null
          was_clicked: boolean | null
          was_converted: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          recommendation_type: string
          score?: number | null
          user_id?: string | null
          was_clicked?: boolean | null
          was_converted?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          recommendation_type?: string
          score?: number | null
          user_id?: string | null
          was_clicked?: boolean | null
          was_converted?: boolean | null
        }
        Relationships: []
      }
      ai_workflows: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          total_runs: number | null
          trigger_type: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          total_runs?: number | null
          trigger_type?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          total_runs?: number | null
          trigger_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          ip_address: unknown
          properties: Json | null
          session_id: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          ip_address?: unknown
          properties?: Json | null
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          ip_address?: unknown
          properties?: Json | null
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auction_watchers: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_watchers_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_winners: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          order_id: string | null
          payment_due_by: string | null
          status: string | null
          winner_id: string
          winning_bid: number
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          payment_due_by?: string | null
          status?: string | null
          winner_id: string
          winning_bid: number
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          payment_due_by?: string | null
          status?: string | null
          winner_id?: string
          winning_bid?: number
        }
        Relationships: [
          {
            foreignKeyName: "auction_winners_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: true
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_winners_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          anti_snipe_seconds: number | null
          bid_increment: number
          created_at: string
          current_bid: number | null
          current_bidder_id: string | null
          ends_at: string
          id: string
          product_id: string
          reserve_price: number | null
          starting_price: number
          starts_at: string
          status: Database["public"]["Enums"]["auction_status"]
          total_bids: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          anti_snipe_seconds?: number | null
          bid_increment?: number
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          ends_at: string
          id?: string
          product_id: string
          reserve_price?: number | null
          starting_price: number
          starts_at: string
          status?: Database["public"]["Enums"]["auction_status"]
          total_bids?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          anti_snipe_seconds?: number | null
          bid_increment?: number
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          ends_at?: string
          id?: string
          product_id?: string
          reserve_price?: number | null
          starting_price?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["auction_status"]
          total_bids?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
          ip_address: unknown
          is_winning: boolean | null
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          is_winning?: boolean | null
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          is_winning?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_metrics: {
        Row: {
          created_at: string
          dimensions: Json | null
          id: string
          metric_date: string
          metric_key: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metric_date: string
          metric_key: string
          metric_value: number
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metric_date?: string
          metric_key?: string
          metric_value?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_translations: Json | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_translations?: Json | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_translations?: Json | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_tracking: {
        Row: {
          created_at: string
          funnel_name: string
          funnel_step: string
          id: string
          metadata: Json | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          funnel_name: string
          funnel_step: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          funnel_name?: string
          funnel_step?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          latitude: number | null
          longitude: number | null
          phone: string
          postal_code: string | null
          recipient_name: string
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone: string
          postal_code?: string | null
          recipient_name: string
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string
          postal_code?: string | null
          recipient_name?: string
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_agents: {
        Row: {
          created_at: string
          current_region: string | null
          full_name: string
          id: string
          is_available: boolean | null
          license_plate: string | null
          partner_id: string | null
          phone: string | null
          rating_avg: number | null
          total_deliveries: number | null
          updated_at: string
          user_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          current_region?: string | null
          full_name: string
          id?: string
          is_available?: boolean | null
          license_plate?: string | null
          partner_id?: string | null
          phone?: string | null
          rating_avg?: number | null
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          current_region?: string | null
          full_name?: string
          id?: string
          is_available?: boolean | null
          license_plate?: string | null
          partner_id?: string | null
          phone?: string | null
          rating_avg?: number | null
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_agents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_partners: {
        Row: {
          api_config: Json | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          regions: string[] | null
          updated_at: string
        }
        Insert: {
          api_config?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          regions?: string[] | null
          updated_at?: string
        }
        Update: {
          api_config?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          regions?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_pricing_rules: {
        Row: {
          base_fee: number
          created_at: string
          id: string
          is_active: boolean | null
          max_distance_km: number | null
          min_distance_km: number | null
          per_km_fee: number
          region: string
          updated_at: string
          weight_multiplier: number | null
        }
        Insert: {
          base_fee: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_distance_km?: number | null
          min_distance_km?: number | null
          per_km_fee?: number
          region: string
          updated_at?: string
          weight_multiplier?: number | null
        }
        Update: {
          base_fee?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_distance_km?: number | null
          min_distance_km?: number | null
          per_km_fee?: number
          region?: string
          updated_at?: string
          weight_multiplier?: number | null
        }
        Relationships: []
      }
      delivery_tasks: {
        Row: {
          agent_id: string | null
          cost: number | null
          created_at: string
          delivered_at: string | null
          drop_address: string
          id: string
          notes: string | null
          order_id: string
          partner_id: string | null
          pickup_address: string | null
          proof_url: string | null
          scheduled_pickup: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          cost?: number | null
          created_at?: string
          delivered_at?: string | null
          drop_address: string
          id?: string
          notes?: string | null
          order_id: string
          partner_id?: string | null
          pickup_address?: string | null
          proof_url?: string | null
          scheduled_pickup?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          cost?: number | null
          created_at?: string
          delivered_at?: string | null
          drop_address?: string
          id?: string
          notes?: string | null
          order_id?: string
          partner_id?: string | null
          pickup_address?: string | null
          proof_url?: string | null
          scheduled_pickup?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "delivery_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_controls: {
        Row: {
          created_at: string
          description: string | null
          engaged_at: string | null
          engaged_by: string | null
          id: string
          is_engaged: boolean
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          engaged_at?: string | null
          engaged_by?: string | null
          id?: string
          is_engaged?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          engaged_at?: string | null
          engaged_by?: string | null
          id?: string
          is_engaged?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      fabric_catalog: {
        Row: {
          color: string | null
          composition: string | null
          created_at: string
          id: string
          image_url: string | null
          in_stock: boolean | null
          metadata: Json | null
          name: string
          origin: string | null
          pattern: string | null
          price_per_meter: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          composition?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          metadata?: Json | null
          name: string
          origin?: string | null
          pattern?: string | null
          price_per_meter?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          composition?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          metadata?: Json | null
          name?: string
          origin?: string | null
          pattern?: string | null
          price_per_meter?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          rollout_percent: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          rollout_percent?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          rollout_percent?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          id: string
          invoice_number: string
          issued_at: string | null
          order_id: string
          pdf_url: string | null
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number: string
          issued_at?: string | null
          order_id: string
          pdf_url?: string | null
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string
          issued_at?: string | null
          order_id?: string
          pdf_url?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      live_delivery_tracking: {
        Row: {
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed_kmh: number | null
          task_id: string
        }
        Insert: {
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed_kmh?: number | null
          task_id: string
        }
        Update: {
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_kmh?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_delivery_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "delivery_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_levels: {
        Row: {
          badge_url: string | null
          created_at: string
          id: string
          min_points: number
          name: string
          perks: Json | null
        }
        Insert: {
          badge_url?: string | null
          created_at?: string
          id?: string
          min_points: number
          name: string
          perks?: Json | null
        }
        Update: {
          badge_url?: string | null
          created_at?: string
          id?: string
          min_points?: number
          name?: string
          perks?: Json | null
        }
        Relationships: []
      }
      measurements: {
        Row: {
          arm_circumference: number | null
          back_length: number | null
          chest: number | null
          created_at: string
          extra: Json | null
          height: number | null
          hips: number | null
          id: string
          inseam: number | null
          is_active: boolean | null
          label: string | null
          neck: number | null
          notes: string | null
          outseam: number | null
          shoulder: number | null
          sleeve_length: number | null
          thigh: number | null
          unit: string
          updated_at: string
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arm_circumference?: number | null
          back_length?: number | null
          chest?: number | null
          created_at?: string
          extra?: Json | null
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          is_active?: boolean | null
          label?: string | null
          neck?: number | null
          notes?: string | null
          outseam?: number | null
          shoulder?: number | null
          sleeve_length?: number | null
          thigh?: number | null
          unit?: string
          updated_at?: string
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arm_circumference?: number | null
          back_length?: number | null
          chest?: number | null
          created_at?: string
          extra?: Json | null
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          is_active?: boolean | null
          label?: string | null
          neck?: number | null
          notes?: string | null
          outseam?: number | null
          shoulder?: number | null
          sleeve_length?: number | null
          thigh?: number | null
          unit?: string
          updated_at?: string
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      moderation_reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string | null
          resolution: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          resolution?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          resolution?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          metadata: Json | null
          order_id: string
          product_id: string | null
          quantity: number
          title: string
          unit_price: number
          variant_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          metadata?: Json | null
          order_id: string
          product_id?: string | null
          quantity?: number
          title: string
          unit_price: number
          variant_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          metadata?: Json | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          title?: string
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
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          delivery_address_id: string | null
          discount_total: number
          grand_total: number
          id: string
          metadata: Json | null
          notes: string | null
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          delivery_address_id?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          delivery_address_id?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          order_id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          order_id: string
          paid_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          reserved: number
          updated_at: string
          variant_id: string | null
          warehouse_location: string | null
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          reserved?: number
          updated_at?: string
          variant_id?: string | null
          warehouse_location?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          reserved?: number
          updated_at?: string
          variant_id?: string | null
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          media_type: string
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          media_type?: string
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          media_type?: string
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_hidden: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name: string
          options: Json | null
          price: number | null
          product_id: string
          sku: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          options?: Json | null
          price?: number | null
          product_id: string
          sku?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          options?: Json | null
          price?: number | null
          product_id?: string
          sku?: string | null
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
          base_price: number
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          description_translations: Json | null
          id: string
          is_auction: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          product_type: Database["public"]["Enums"]["product_type"]
          rating_avg: number | null
          rating_count: number | null
          sales_count: number | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          tags: string[] | null
          title: string
          title_translations: Json | null
          updated_at: string
          vendor_id: string | null
          view_count: number | null
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          description_translations?: Json | null
          id?: string
          is_auction?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          product_type?: Database["public"]["Enums"]["product_type"]
          rating_avg?: number | null
          rating_count?: number | null
          sales_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title: string
          title_translations?: Json | null
          updated_at?: string
          vendor_id?: string | null
          view_count?: number | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          description_translations?: Json | null
          id?: string
          is_auction?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          product_type?: Database["public"]["Enums"]["product_type"]
          rating_avg?: number | null
          rating_count?: number | null
          sales_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title?: string
          title_translations?: Json | null
          updated_at?: string
          vendor_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          id: string
          language: string | null
          lee_tokens: number
          metadata: Json | null
          phone: string | null
          updated_at: string
          username: string | null
          wallet_balance: number
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          id: string
          language?: string | null
          lee_tokens?: number
          metadata?: Json | null
          phone?: string | null
          updated_at?: string
          username?: string | null
          wallet_balance?: number
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          language?: string | null
          lee_tokens?: number
          metadata?: Json | null
          phone?: string | null
          updated_at?: string
          username?: string | null
          wallet_balance?: number
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          status: string
          token_amount: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          status?: string
          token_amount?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          status?: string
          token_amount?: number | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_id: string | null
          processed_by: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_id?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_id?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          points: number
          tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          points?: number
          tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          points?: number
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_collections: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          name: string
          product_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name: string
          product_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name?: string
          product_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_tracking: {
        Row: {
          carrier: string | null
          created_at: string
          current_location: string | null
          estimated_delivery: string | null
          id: string
          order_id: string
          status: string | null
          tracking_number: string | null
          updated_at: string
          updates: Json | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          current_location?: string | null
          estimated_delivery?: string | null
          id?: string
          order_id: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
          updates?: Json | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          current_location?: string | null
          estimated_delivery?: string | null
          id?: string
          order_id?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
          updates?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachments: string[] | null
          body: string
          created_at: string
          id: string
          is_internal: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          related_order_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      system_announcements: {
        Row: {
          audience: string | null
          body: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          severity: string | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          severity?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          severity?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tailoring_appointments: {
        Row: {
          created_at: string
          customer_id: string
          duration_minutes: number | null
          id: string
          location: string | null
          scheduled_for: string
          status: string | null
          tailor_id: string | null
          tailoring_order_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          scheduled_for: string
          status?: string | null
          tailor_id?: string | null
          tailoring_order_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          scheduled_for?: string
          status?: string | null
          tailor_id?: string | null
          tailoring_order_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailoring_appointments_tailoring_order_id_fkey"
            columns: ["tailoring_order_id"]
            isOneToOne: false
            referencedRelation: "tailoring_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tailoring_orders: {
        Row: {
          agreed_price: number | null
          created_at: string
          currency: string | null
          customer_id: string
          delivery_date: string | null
          fabric_id: string | null
          id: string
          measurements_id: string | null
          metadata: Json | null
          notes: string | null
          quoted_price: number | null
          reference_images: string[] | null
          related_order_id: string | null
          status: Database["public"]["Enums"]["tailoring_status"]
          style_brief: string | null
          tailor_id: string | null
          updated_at: string
        }
        Insert: {
          agreed_price?: number | null
          created_at?: string
          currency?: string | null
          customer_id: string
          delivery_date?: string | null
          fabric_id?: string | null
          id?: string
          measurements_id?: string | null
          metadata?: Json | null
          notes?: string | null
          quoted_price?: number | null
          reference_images?: string[] | null
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["tailoring_status"]
          style_brief?: string | null
          tailor_id?: string | null
          updated_at?: string
        }
        Update: {
          agreed_price?: number | null
          created_at?: string
          currency?: string | null
          customer_id?: string
          delivery_date?: string | null
          fabric_id?: string | null
          id?: string
          measurements_id?: string | null
          metadata?: Json | null
          notes?: string | null
          quoted_price?: number | null
          reference_images?: string[] | null
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["tailoring_status"]
          style_brief?: string | null
          tailor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailoring_orders_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabric_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailoring_orders_measurements_id_fkey"
            columns: ["measurements_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tailoring_orders_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tailoring_progress_updates: {
        Row: {
          created_at: string
          id: string
          images: string[] | null
          message: string | null
          posted_by: string
          stage: string | null
          tailoring_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          images?: string[] | null
          message?: string | null
          posted_by: string
          stage?: string | null
          tailoring_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          images?: string[] | null
          message?: string | null
          posted_by?: string
          stage?: string | null
          tailoring_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailoring_progress_updates_tailoring_order_id_fkey"
            columns: ["tailoring_order_id"]
            isOneToOne: false
            referencedRelation: "tailoring_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tailoring_revisions: {
        Row: {
          created_at: string
          description: string
          id: string
          reference_images: string[] | null
          requested_by: string
          status: string | null
          tailoring_order_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          reference_images?: string[] | null
          requested_by: string
          status?: string | null
          tailoring_order_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          reference_images?: string[] | null
          requested_by?: string
          status?: string | null
          tailoring_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tailoring_revisions_tailoring_order_id_fkey"
            columns: ["tailoring_order_id"]
            isOneToOne: false
            referencedRelation: "tailoring_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity: string
          context: Json | null
          created_at: string
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          activity: string
          context?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          activity?: string
          context?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_performance: {
        Row: {
          avg_rating: number | null
          cancellation_rate: number | null
          created_at: string
          id: string
          on_time_rate: number | null
          orders_count: number | null
          period_end: string
          period_start: string
          total_sales: number | null
          vendor_id: string
        }
        Insert: {
          avg_rating?: number | null
          cancellation_rate?: number | null
          created_at?: string
          id?: string
          on_time_rate?: number | null
          orders_count?: number | null
          period_end: string
          period_start: string
          total_sales?: number | null
          vendor_id: string
        }
        Update: {
          avg_rating?: number | null
          cancellation_rate?: number | null
          created_at?: string
          id?: string
          on_time_rate?: number | null
          orders_count?: number | null
          period_end?: string
          period_start?: string
          total_sales?: number | null
          vendor_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference: string | null
          related_order_id: string | null
          token_amount: number
          tx_type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          related_order_id?: string | null
          token_amount?: number
          tx_type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          related_order_id?: string | null
          token_amount?: number
          tx_type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_locked: boolean
          lee_tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_locked?: boolean
          lee_tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_locked?: boolean
          lee_tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dispatch_edge: {
        Args: { _fn: string; _payload: Json }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_status:
        | "active"
        | "suspended"
        | "banned"
        | "pending_verification"
        | "deleted"
      app_role:
        | "super_admin"
        | "admin"
        | "moderator"
        | "support"
        | "vendor"
        | "tailor"
        | "designer"
        | "logistics"
        | "customer"
      auction_status:
        | "scheduled"
        | "live"
        | "ended"
        | "cancelled"
        | "sold"
        | "unsold"
      delivery_status:
        | "pending"
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "returned"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "disputed"
      payment_provider:
        | "mpesa"
        | "card"
        | "paypal"
        | "stripe"
        | "wallet"
        | "token"
        | "bank_transfer"
        | "other"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "partially_paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "cancelled"
      product_status:
        | "draft"
        | "pending_review"
        | "active"
        | "rejected"
        | "archived"
        | "out_of_stock"
      product_type:
        | "physical"
        | "digital"
        | "customizable"
        | "auction"
        | "bespoke"
      tailoring_status:
        | "requested"
        | "measurements_pending"
        | "in_review"
        | "approved"
        | "in_production"
        | "quality_check"
        | "ready"
        | "delivered"
        | "cancelled"
        | "revision_requested"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status: "open" | "pending" | "resolved" | "closed" | "escalated"
      wallet_tx_type:
        | "credit"
        | "debit"
        | "refund"
        | "reward"
        | "referral"
        | "cashback"
        | "withdrawal"
        | "adjustment"
        | "purchase"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: [
        "active",
        "suspended",
        "banned",
        "pending_verification",
        "deleted",
      ],
      app_role: [
        "super_admin",
        "admin",
        "moderator",
        "support",
        "vendor",
        "tailor",
        "designer",
        "logistics",
        "customer",
      ],
      auction_status: [
        "scheduled",
        "live",
        "ended",
        "cancelled",
        "sold",
        "unsold",
      ],
      delivery_status: [
        "pending",
        "assigned",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
        "returned",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "disputed",
      ],
      payment_provider: [
        "mpesa",
        "card",
        "paypal",
        "stripe",
        "wallet",
        "token",
        "bank_transfer",
        "other",
      ],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "partially_paid",
        "failed",
        "refunded",
        "partially_refunded",
        "cancelled",
      ],
      product_status: [
        "draft",
        "pending_review",
        "active",
        "rejected",
        "archived",
        "out_of_stock",
      ],
      product_type: [
        "physical",
        "digital",
        "customizable",
        "auction",
        "bespoke",
      ],
      tailoring_status: [
        "requested",
        "measurements_pending",
        "in_review",
        "approved",
        "in_production",
        "quality_check",
        "ready",
        "delivered",
        "cancelled",
        "revision_requested",
      ],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: ["open", "pending", "resolved", "closed", "escalated"],
      wallet_tx_type: [
        "credit",
        "debit",
        "refund",
        "reward",
        "referral",
        "cashback",
        "withdrawal",
        "adjustment",
        "purchase",
      ],
    },
  },
} as const
