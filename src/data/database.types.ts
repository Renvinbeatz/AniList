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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      airing_schedule: {
        Row: {
          airing_at: string
          anilist_airing_id: number
          anime_id: string
          created_at: string
          episode: number
          id: string
          updated_at: string
        }
        Insert: {
          airing_at: string
          anilist_airing_id: number
          anime_id: string
          created_at?: string
          episode: number
          id?: string
          updated_at?: string
        }
        Update: {
          airing_at?: string
          anilist_airing_id?: number
          anime_id?: string
          created_at?: string
          episode?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "airing_schedule_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      anime: {
        Row: {
          anilist_id: number
          average_score: number | null
          banner_image: string | null
          cover_color: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          duration: number | null
          episodes: number | null
          genres: string[] | null
          id: string
          season: string | null
          season_year: number | null
          status: string | null
          title_english: string | null
          title_native: string | null
          title_romaji: string | null
          updated_at: string
        }
        Insert: {
          anilist_id: number
          average_score?: number | null
          banner_image?: string | null
          cover_color?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          episodes?: number | null
          genres?: string[] | null
          id?: string
          season?: string | null
          season_year?: number | null
          status?: string | null
          title_english?: string | null
          title_native?: string | null
          title_romaji?: string | null
          updated_at?: string
        }
        Update: {
          anilist_id?: number
          average_score?: number | null
          banner_image?: string | null
          cover_color?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          episodes?: number | null
          genres?: string[] | null
          id?: string
          season?: string | null
          season_year?: number | null
          status?: string | null
          title_english?: string | null
          title_native?: string | null
          title_romaji?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platforms: {
        Row: {
          id: string
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          id?: string
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          id?: string
          logo_url?: string | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_anime: {
        Row: {
          anime_id: string
          completed_at: string | null
          created_at: string
          current_episode: number
          id: string
          is_favorite: boolean
          notes: string | null
          profile_id: string
          score: number | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          anime_id: string
          completed_at?: string | null
          created_at?: string
          current_episode?: number
          id?: string
          is_favorite?: boolean
          notes?: string | null
          profile_id: string
          score?: number | null
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          anime_id?: string
          completed_at?: string | null
          created_at?: string
          current_episode?: number
          id?: string
          is_favorite?: boolean
          notes?: string | null
          profile_id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_anime_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_anime_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_anime_platforms: {
        Row: {
          id: string
          platform_id: string
          user_anime_id: string
        }
        Insert: {
          id?: string
          platform_id: string
          user_anime_id: string
        }
        Update: {
          id?: string
          platform_id?: string
          user_anime_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_anime_platforms_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_anime_platforms_user_anime_id_fkey"
            columns: ["user_anime_id"]
            isOneToOne: false
            referencedRelation: "user_anime"
            referencedColumns: ["id"]
          },
        ]
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
