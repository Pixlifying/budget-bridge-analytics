export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          amount: number
          created_at: string | null
          customer_name: string
          date: string
          id: string
          pages_count: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_name: string
          date?: string
          id?: string
          pages_count: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_name?: string
          date?: string
          id?: string
          pages_count?: number
        }
        Relationships: []
      }
      banking_services: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          margin: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          id?: string
          margin: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          margin?: number
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
      online_services: {
        Row: {
          amount: number
          count: number
          created_at: string | null
          custom_service: string | null
          customer_name: string | null
          date: string
          id: string
          service: string
          total: number
        }
        Insert: {
          amount: number
          count: number
          created_at?: string | null
          custom_service?: string | null
          customer_name?: string | null
          date?: string
          id?: string
          service: string
          total: number
        }
        Update: {
          amount?: number
          count?: number
          created_at?: string | null
          custom_service?: string | null
          customer_name?: string | null
          date?: string
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
          amount_per_page: number
          created_at: string | null
          date: string
          id: string
          is_double_sided: boolean
          margin: number
          pages_count: number
          total_amount: number
        }
        Insert: {
          amount_per_page: number
          created_at?: string | null
          date?: string
          id?: string
          is_double_sided?: boolean
          margin: number
          pages_count: number
          total_amount: number
        }
        Update: {
          amount_per_page?: number
          created_at?: string | null
          date?: string
          id?: string
          is_double_sided?: boolean
          margin?: number
          pages_count?: number
          total_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
