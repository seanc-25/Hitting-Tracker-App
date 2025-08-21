export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          first_name: string
          last_name: string
          birthday: string
          hitting_side: 'left' | 'right' | 'switch'
          created_at: string
          updated_at: string
          has_completed_onboarding: boolean
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          first_name: string
          last_name: string
          birthday: string
          hitting_side: 'left' | 'right' | 'switch'
          created_at?: string
          updated_at?: string
          has_completed_onboarding?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          first_name?: string
          last_name?: string
          birthday?: string
          hitting_side?: 'left' | 'right' | 'switch'
          created_at?: string
          updated_at?: string
          has_completed_onboarding?: boolean
        }
        Relationships: []
      }
      at_bats: {
        Row: {
          id: string
          user_id: string
          date: string
          pitch_type: string
          timing: string
          pitch_location: number
          contact: number
          hit_type: string
          hit_location: string | null
          batting_side: 'Left' | 'Right' // Now required, not nullable
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          pitch_type: string
          timing: string
          pitch_location: number
          contact: number
          hit_type: string
          hit_location?: string | null
          batting_side: 'Left' | 'Right' // Required for inserts
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          pitch_type?: string
          timing?: string
          pitch_location?: number
          contact?: number
          hit_type?: string
          hit_location?: string | null
          batting_side?: 'Left' | 'Right' // Optional for updates but still typed correctly
          created_at?: string
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never 