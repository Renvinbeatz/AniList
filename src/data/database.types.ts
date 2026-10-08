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
          format: string | null
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
          format?: string | null
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
          format?: string | null
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
      community_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          profile_id: string
          spoiler: boolean
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          profile_id: string
          spoiler?: boolean
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          profile_id?: string
          spoiler?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_parent_id_fkey"
            columns: ["post_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["post_id", "id"]
          },
          {
            foreignKeyName: "community_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_moderators: {
        Row: {
          profile_id: string
        }
        Insert: {
          profile_id: string
        }
        Update: {
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          anime_id: string | null
          body: string
          created_at: string
          id: string
          image_url: string | null
          kind: string
          profile_id: string
          spoiler: boolean
          title: string
          updated_at: string
        }
        Insert: {
          anime_id?: string | null
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          profile_id: string
          spoiler?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          anime_id?: string | null
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          profile_id?: string
          spoiler?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          snapshot: Json
          state: string
          target_id: string
          target_profile_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          snapshot: Json
          state?: string
          target_id: string
          target_profile_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          snapshot?: Json
          state?: string
          target_id?: string
          target_profile_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      library_activity: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          status: string
          user_anime_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          status: string
          user_anime_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
          user_anime_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_activity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_activity_profile_id_user_anime_id_fkey"
            columns: ["profile_id", "user_anime_id"]
            isOneToOne: false
            referencedRelation: "user_anime"
            referencedColumns: ["profile_id", "id"]
          },
        ]
      }
      personal_platforms: {
        Row: {
          id: string
          name: string
          profile_id: string
          website_url: string | null
        }
        Insert: {
          id?: string
          name: string
          profile_id: string
          website_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          profile_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_platforms_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      profile_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_favorites: {
        Row: {
          anime_id: string
          position: number
          profile_id: string
        }
        Insert: {
          anime_id: string
          position: number
          profile_id: string
        }
        Update: {
          anime_id?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_favorites_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_pinned_anime: {
        Row: {
          anime_id: string
          position: number
          profile_id: string
        }
        Insert: {
          anime_id: string
          position: number
          profile_id: string
        }
        Update: {
          anime_id?: string
          position?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_pinned_anime_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_pinned_anime_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_preset: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          favorite_character_anilist_id: number | null
          id: string
          profile_visibility: string
          share_library_activity: boolean
          social_links: Json | null
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_preset?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_character_anilist_id?: number | null
          id?: string
          profile_visibility?: string
          share_library_activity?: boolean
          social_links?: Json | null
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_preset?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_character_anilist_id?: number | null
          id?: string
          profile_visibility?: string
          share_library_activity?: boolean
          social_links?: Json | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      social_notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          kind: string
          post_id: string | null
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          kind: string
          post_id?: string | null
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          post_id?: string | null
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_publish_log: {
        Row: {
          bucket: string
          created_at: string
          id: number
          profile_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: never
          profile_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: never
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_publish_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_anime_personal_platforms: {
        Row: {
          personal_platform_id: string
          profile_id: string
          user_anime_id: string
        }
        Insert: {
          personal_platform_id: string
          profile_id: string
          user_anime_id: string
        }
        Update: {
          personal_platform_id?: string
          profile_id?: string
          user_anime_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_anime_personal_platforms_profile_id_personal_platform_fkey"
            columns: ["profile_id", "personal_platform_id"]
            isOneToOne: false
            referencedRelation: "personal_platforms"
            referencedColumns: ["profile_id", "id"]
          },
          {
            foreignKeyName: "user_anime_personal_platforms_profile_id_user_anime_id_fkey"
            columns: ["profile_id", "user_anime_id"]
            isOneToOne: false
            referencedRelation: "user_anime"
            referencedColumns: ["profile_id", "id"]
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
      mutate_profile_collection: {
        Args: {
          p_anime_id: string
          p_collection: string
          p_operation: string
          p_position?: number
          p_profile_id: string
        }
        Returns: string
      }
      read_public_library: {
        Args: { p_page?: number; p_status?: string | null; p_username: string }
        Returns: Json
      }
      read_public_profile: { Args: { p_username: string }; Returns: Json }
      social_activity_setting: {
        Args: { p_actor: string | null; p_enabled: boolean }
        Returns: boolean
      }
      social_block: {
        Args: { p_actor: string | null; p_selected: boolean; p_username: string }
        Returns: boolean
      }
      social_blocked_list: { Args: { p_actor: string | null }; Returns: Json }
      social_comments: {
        Args: { p_actor: string | null; p_page?: number; p_post: string }
        Returns: Json
      }
      social_feed: {
        Args: {
          p_actor: string | null
          p_anime?: string | null
          p_id?: string | null
          p_mode?: string
          p_page?: number
        }
        Returns: Json
      }
      social_follow: {
        Args: { p_actor: string | null; p_selected: boolean; p_username: string }
        Returns: boolean
      }
      social_moderation_queue: {
        Args: { p_actor: string | null; p_page?: number }
        Returns: Json
      }
      social_notification_list: {
        Args: { p_actor: string | null; p_page?: number }
        Returns: Json
      }
      social_notify: {
        Args: {
          p_actor: string | null
          p_comment?: string
          p_kind: string
          p_post?: string
          p_recipient: string
        }
        Returns: undefined
      }
      social_people: {
        Args: {
          p_actor: string | null
          p_mode?: string
          p_page?: number
          p_query?: string
          p_username?: string | null
        }
        Returns: Json
      }
      social_post_visible: {
        Args: { p_actor: string | null; p_post: string }
        Returns: boolean
      }
      social_rate: {
        Args: { p_actor: string | null; p_bucket: string }
        Returns: number
      }
      social_relationship: {
        Args: { p_actor: string | null; p_username: string }
        Returns: Json
      }
      social_report: {
        Args: {
          p_actor: string | null
          p_detail: string | null
          p_reason: string
          p_target: string
          p_target_type: string
        }
        Returns: Json
      }
      social_resolve_report: {
        Args: { p_actor: string | null; p_id: string | null; p_remove: boolean }
        Returns: boolean
      }
      social_save_comment: {
        Args: {
          p_actor: string | null
          p_body: string
          p_id: string | null
          p_parent: string | null
          p_post: string
          p_spoiler: boolean
        }
        Returns: Json
      }
      social_save_post: {
        Args: {
          p_actor: string | null
          p_body: string
          p_id: string | null
          p_image: string | null
          p_spoiler: boolean
          p_title: string
        }
        Returns: Json
      }
      social_save_review: {
        Args: {
          p_actor: string | null
          p_anime: string
          p_body: string
          p_id: string | null
          p_image: string | null
          p_spoiler: boolean
          p_title: string
        }
        Returns: Json
      }
      social_visible: {
        Args: { p_actor: string | null; p_subject: string }
        Returns: boolean
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
