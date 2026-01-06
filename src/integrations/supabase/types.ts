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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_details: {
        Row: {
          aadhar_number: string
          account_number: string
          address: string | null
          created_at: string
          id: string
          mobile_number: string | null
          name: string
          updated_at: string
        }
        Insert: {
          aadhar_number: string
          account_number: string
          address?: string | null
          created_at?: string
          id?: string
          mobile_number?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          aadhar_number?: string
          account_number?: string
          address?: string | null
          created_at?: string
          id?: string
          mobile_number?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          amount: number
          created_at: string | null
          customer_name: string
          date: string
          expense: number | null
          id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_name: string
          date?: string
          expense?: number | null
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_name?: string
          date?: string
          expense?: number | null
          id?: string
        }
        Relationships: []
      }
      banking_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          amount: number
          created_at: string | null
          customer_name: string
          date: string
          expense: number | null
          id: string
          insurance_type: string | null
          margin: number | null
        }
        Insert: {
          account_number?: string | null
          account_type: string
          amount: number
          created_at?: string | null
          customer_name: string
          date?: string
          expense?: number | null
          id?: string
          insurance_type?: string | null
          margin?: number | null
        }
        Update: {
          account_number?: string | null
          account_type?: string
          amount?: number
          created_at?: string | null
          customer_name?: string
          date?: string
          expense?: number | null
          id?: string
          insurance_type?: string | null
          margin?: number | null
        }
        Relationships: []
      }
      banking_services: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          extra_amount: number | null
          id: string
          margin: number
          transaction_count: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          extra_amount?: number | null
          id?: string
          margin: number
          transaction_count?: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          extra_amount?: number | null
          id?: string
          margin?: number
          transaction_count?: number
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_analysis_records: {
        Row: {
          cash_in_hand: number
          created_at: string
          date: string
          file_name: string
          id: string
          total_deposit: number
          total_withdrawal: number
          updated_at: string
        }
        Insert: {
          cash_in_hand?: number
          created_at?: string
          date?: string
          file_name: string
          id?: string
          total_deposit?: number
          total_withdrawal?: number
          updated_at?: string
        }
        Update: {
          cash_in_hand?: number
          created_at?: string
          date?: string
          file_name?: string
          id?: string
          total_deposit?: number
          total_withdrawal?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_transactions: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          date: string | null
          description: string | null
          id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          date?: string | null
          description?: string | null
          id?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          date?: string | null
          description?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          phone: string
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          phone: string
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      daily_needs: {
        Row: {
          created_at: string
          date: string
          id: string
          item_name: string
          price_per_unit: number
          quantity: number
          total_price: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          item_name: string
          price_per_unit?: number
          quantity?: number
          total_price?: number | null
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          item_name?: string
          price_per_unit?: number
          quantity?: number
          total_price?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      dlc_records: {
        Row: {
          account_number: string
          created_at: string
          date: string
          id: string
          parman_id: string | null
          pensioner_name: string
          ppo_number: string
          remarks: string | null
          updated_at: string
        }
        Insert: {
          account_number: string
          created_at?: string
          date?: string
          id?: string
          parman_id?: string | null
          pensioner_name: string
          ppo_number: string
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string
          created_at?: string
          date?: string
          id?: string
          parman_id?: string | null
          pensioner_name?: string
          ppo_number?: string
          remarks?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          id?: string
          name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      fee_expenses: {
        Row: {
          created_at: string | null
          customer_name: string
          date: string
          fee: number
          id: string
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          date?: string
          fee: number
          id?: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          date?: string
          fee?: number
          id?: string
        }
        Relationships: []
      }
      forms: {
        Row: {
          address: string
          created_at: string
          date: string
          department: string
          id: string
          mobile: string
          name: string
          parentage: string
          remarks: string | null
          s_no: number
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          date?: string
          department?: string
          id?: string
          mobile: string
          name: string
          parentage: string
          remarks?: string | null
          s_no?: number
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          date?: string
          department?: string
          id?: string
          mobile?: string
          name?: string
          parentage?: string
          remarks?: string | null
          s_no?: number
          updated_at?: string
        }
        Relationships: []
      }
      khata_customers: {
        Row: {
          created_at: string
          id: string
          name: string
          opening_balance: number
          opening_date: string
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          opening_balance?: number
          opening_date?: string
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          opening_balance?: number
          opening_date?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      khata_transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          description: string | null
          id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          date?: string
          description?: string | null
          id?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          description?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "khata_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "khata_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_customers: {
        Row: {
          account_number: string
          adhar_number: string
          created_at: string
          id: string
          mobile_number: string | null
          name: string
          updated_at: string
        }
        Insert: {
          account_number: string
          adhar_number: string
          created_at?: string
          id?: string
          mobile_number?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          adhar_number?: string
          created_at?: string
          id?: string
          mobile_number?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      milk_records: {
        Row: {
          amount_per_litre: number
          created_at: string | null
          date: string
          id: string
          milk_amount: number
          received: boolean
          total: number | null
          updated_at: string | null
        }
        Insert: {
          amount_per_litre: number
          created_at?: string | null
          date?: string
          id?: string
          milk_amount: number
          received?: boolean
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_per_litre?: number
          created_at?: string | null
          date?: string
          id?: string
          milk_amount?: number
          received?: boolean
          total?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      misc_expenses: {
        Row: {
          created_at: string | null
          date: string
          fee: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          fee: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          fee?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      od_detail_records: {
        Row: {
          amount_given: number
          amount_received: number
          cash_in_hand: number
          created_at: string
          date: string
          id: string
          last_balance: number
          od_from_bank: number
          remarks: string | null
          updated_at: string
        }
        Insert: {
          amount_given?: number
          amount_received?: number
          cash_in_hand?: number
          created_at?: string
          date?: string
          id?: string
          last_balance?: number
          od_from_bank?: number
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          amount_given?: number
          amount_received?: number
          cash_in_hand?: number
          created_at?: string
          date?: string
          id?: string
          last_balance?: number
          od_from_bank?: number
          remarks?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      online_services: {
        Row: {
          amount: number
          created_at: string | null
          custom_service: string | null
          customer_name: string | null
          date: string
          expense: number | null
          id: string
          service: string
          total: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          custom_service?: string | null
          customer_name?: string | null
          date?: string
          expense?: number | null
          id?: string
          service: string
          total: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          custom_service?: string | null
          customer_name?: string | null
          date?: string
          expense?: number | null
          id?: string
          service?: string
          total?: number
        }
        Relationships: []
      }
      pan_cards: {
        Row: {
          amount: number
          count: number
          created_at: string | null
          date: string
          id: string
          margin: number
          total: number
        }
        Insert: {
          amount: number
          count: number
          created_at?: string | null
          date?: string
          id?: string
          margin: number
          total: number
        }
        Update: {
          amount?: number
          count?: number
          created_at?: string | null
          date?: string
          id?: string
          margin?: number
          total?: number
        }
        Relationships: []
      }
      passports: {
        Row: {
          amount: number
          count: number
          created_at: string | null
          date: string
          id: string
          margin: number
          total: number
        }
        Insert: {
          amount: number
          count: number
          created_at?: string | null
          date?: string
          id?: string
          margin: number
          total: number
        }
        Update: {
          amount?: number
          count?: number
          created_at?: string | null
          date?: string
          id?: string
          margin?: number
          total?: number
        }
        Relationships: []
      }
      pending_balances: {
        Row: {
          address: string
          amount: number
          created_at: string | null
          custom_service: string | null
          date: string
          id: string
          name: string
          phone: string
          service: string
        }
        Insert: {
          address: string
          amount: number
          created_at?: string | null
          custom_service?: string | null
          date?: string
          id?: string
          name: string
          phone: string
          service: string
        }
        Update: {
          address?: string
          amount?: number
          created_at?: string | null
          custom_service?: string | null
          date?: string
          id?: string
          name?: string
          phone?: string
          service?: string
        }
        Relationships: []
      }
      photostats: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          expense: number | null
          id: string
          is_double_sided: boolean
          margin: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          expense?: number | null
          id?: string
          is_double_sided?: boolean
          margin: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          expense?: number | null
          id?: string
          is_double_sided?: boolean
          margin?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reminder_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reminder_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reminder_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_security: {
        Row: {
          account_number: string
          address: string | null
          created_at: string | null
          date: string
          id: string
          name: string
          remarks: string | null
          scheme_type: string
          updated_at: string | null
        }
        Insert: {
          account_number: string
          address?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name: string
          remarks?: string | null
          scheme_type: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          address?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          remarks?: string | null
          scheme_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          amount: number
          class_id: string
          created_at: string
          id: string
          name: string
          paper_count: number
        }
        Insert: {
          amount?: number
          class_id: string
          created_at?: string
          id?: string
          name: string
          paper_count?: number
        }
        Update: {
          amount?: number
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          paper_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string
          created_at: string | null
          file_path: string | null
          id: string
          name: string
          placeholders: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_path?: string | null
          id?: string
          name: string
          placeholders?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_path?: string | null
          id?: string
          name?: string
          placeholders?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      udhar_records: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          name: string
          remarks: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          name: string
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          name?: string
          remarks?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      uploaded_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      user_admin: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["app_role"]
          user_uuid?: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { user_uuid?: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
