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
      cache: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          channel_type: Database["public"]["Enums"]["chat_channel_type"] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          channel_type?: Database["public"]["Enums"]["chat_channel_type"] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["chat_channel_type"] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          channel_id: string | null
          created_at: string | null
          id: string
          message: string | null
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_participants: {
        Row: {
          channel_id: string | null
          id: string
          joined_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_participants_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          host_id: string | null
          id: string
          is_paid: boolean | null
          is_virtual: boolean | null
          location_id: string | null
          price: number | null
          start_time: string | null
          tag_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          host_id?: string | null
          id?: string
          is_paid?: boolean | null
          is_virtual?: boolean | null
          location_id?: string | null
          price?: number | null
          start_time?: string | null
          tag_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          host_id?: string | null
          id?: string
          is_paid?: boolean | null
          is_virtual?: boolean | null
          location_id?: string | null
          price?: number | null
          start_time?: string | null
          tag_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      guides: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          name: string
          tag_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          tag_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          tag_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          admin_code1: string | null
          admin_code2: string | null
          admin_name2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          full_region_path: string | null
          geoname_id: number | null
          id: string
          latitude: number | null
          longitude: number | null
          population: number | null
          region: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_name2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          full_region_path?: string | null
          geoname_id?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          region?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_name2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          full_region_path?: string | null
          geoname_id?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          region?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      org_relationships: {
        Row: {
          connection_type:
            | Database["public"]["Enums"]["org_connection_type"]
            | null
          created_at: string | null
          department: string | null
          id: string
          notes: string | null
          organization_id: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          connection_type?:
            | Database["public"]["Enums"]["org_connection_type"]
            | null
          created_at?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          connection_type?:
            | Database["public"]["Enums"]["org_connection_type"]
            | null
          created_at?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_relationships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_relationships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_admins: {
        Row: {
          can_edit_profile: boolean | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          organization_id: string | null
          profile_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          can_edit_profile?: boolean | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          organization_id?: string | null
          profile_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          can_edit_profile?: boolean | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          organization_id?: string | null
          profile_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          location_id: string | null
          logo_api_url: string | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          location_id?: string | null
          logo_api_url?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          location_id?: string | null
          logo_api_url?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          media_type: Database["public"]["Enums"]["post_media_type"]
          post_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: Database["public"]["Enums"]["post_media_type"]
          post_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["post_media_type"]
          post_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          has_media: boolean
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          has_media?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          has_media?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          headline: string | null
          id: string
          is_approved: boolean | null
          last_name: string | null
          linkedin_url: string | null
          location_id: string | null
          membership_tier: Database["public"]["Enums"]["pricing_tier"] | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          location_id?: string | null
          membership_tier?: Database["public"]["Enums"]["pricing_tier"] | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean | null
          last_name?: string | null
          linkedin_url?: string | null
          location_id?: string | null
          membership_tier?: Database["public"]["Enums"]["pricing_tier"] | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_assignments: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string | null
          target_id: string
          target_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id?: string | null
          target_id: string
          target_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string | null
          target_id?: string
          target_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_entity_types: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_entity_types_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_entity_types_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_entity_types_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_entity_types_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_entity_types_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          console_output: string | null
          created_at: string | null
          duration_ms: number
          error_message: string | null
          id: string
          stack_trace: string | null
          status: Database["public"]["Enums"]["test_status"]
          test_name: string
          test_run_id: string
          test_suite: string
          test_suite_id: string | null
        }
        Insert: {
          console_output?: string | null
          created_at?: string | null
          duration_ms?: number
          error_message?: string | null
          id?: string
          stack_trace?: string | null
          status: Database["public"]["Enums"]["test_status"]
          test_name: string
          test_run_id: string
          test_suite: string
          test_suite_id?: string | null
        }
        Update: {
          console_output?: string | null
          created_at?: string | null
          duration_ms?: number
          error_message?: string | null
          id?: string
          stack_trace?: string | null
          status?: Database["public"]["Enums"]["test_status"]
          test_name?: string
          test_run_id?: string
          test_suite?: string
          test_suite_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_suite_id_fkey"
            columns: ["test_suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_run_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          source: string | null
          test_run_id: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          message: string
          source?: string | null
          test_run_id: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          source?: string | null
          test_run_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_run_logs_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          created_at: string | null
          duration_ms: number
          failed_tests: number
          git_branch: string | null
          git_commit: string | null
          id: string
          passed_tests: number
          run_at: string | null
          skipped_tests: number
          status: Database["public"]["Enums"]["test_run_status"]
          total_tests: number
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number
          failed_tests?: number
          git_branch?: string | null
          git_commit?: string | null
          id?: string
          passed_tests?: number
          run_at?: string | null
          skipped_tests?: number
          status?: Database["public"]["Enums"]["test_run_status"]
          total_tests?: number
        }
        Update: {
          created_at?: string | null
          duration_ms?: number
          failed_tests?: number
          git_branch?: string | null
          git_commit?: string | null
          id?: string
          passed_tests?: number
          run_at?: string | null
          skipped_tests?: number
          status?: Database["public"]["Enums"]["test_run_status"]
          total_tests?: number
        }
        Relationships: []
      }
      test_suites: {
        Row: {
          created_at: string
          duration_ms: number
          error_message: string | null
          file_path: string
          id: string
          status: Database["public"]["Enums"]["test_suite_status"]
          suite_name: string
          test_count: number
          test_run_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          file_path: string
          id?: string
          status: Database["public"]["Enums"]["test_suite_status"]
          suite_name: string
          test_count?: number
          test_run_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          file_path?: string
          id?: string
          status?: Database["public"]["Enums"]["test_suite_status"]
          suite_name?: string
          test_count?: number
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_suites_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      all_tags_with_entity_types_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_types: string[] | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reply_counts: {
        Row: {
          count: number | null
          parent_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tag_assignments_view: {
        Row: {
          created_at: string | null
          entity_types: string[] | null
          id: string | null
          tag_created_by: string | null
          tag_description: string | null
          tag_id: string | null
          tag_name: string | null
          target_id: string | null
          target_type: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["tag_created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["tag_created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events_with_tags: {
        Row: {
          assigned_tag_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          host_id: string | null
          id: string | null
          is_paid: boolean | null
          is_virtual: boolean | null
          location_id: string | null
          price: number | null
          start_time: string | null
          tag_id: string | null
          tag_name: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      filtered_entity_tags_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_type: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_details: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_featured: boolean | null
          name: string | null
          tag_description: string | null
          tag_id: string | null
          tag_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "all_tags_with_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "filtered_entity_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "orphaned_tags_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag_entity_types_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_with_tags: {
        Row: {
          assigned_tag_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_verified: boolean | null
          location_id: string | null
          logo_api_url: string | null
          logo_url: string | null
          name: string | null
          tag_name: string | null
          updated_at: string | null
          website_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      orphaned_tags_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_types: string[] | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_types?: never
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_types?: never
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      people_with_tags: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          headline: string | null
          id: string | null
          is_approved: boolean | null
          last_name: string | null
          linkedin_url: string | null
          location_id: string | null
          membership_tier: Database["public"]["Enums"]["pricing_tier"] | null
          tag_names: string[] | null
          tags: Json[] | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_entity_types_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_types: string[] | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people_with_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_test_schema: {
        Args: { schema_name: string }
        Returns: Json
      }
      drop_test_schema: {
        Args: { schema_name: string }
        Returns: Json
      }
      get_cached_tags: {
        Args: { cache_key: string }
        Returns: Json
      }
      get_table_info: {
        Args: { p_schema: string; p_table: string }
        Returns: Json
      }
      is_site_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      pg_get_tabledef: {
        Args: { p_schema: string; p_table: string }
        Returns: string
      }
      query_tags: {
        Args: { query_text: string }
        Returns: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }[]
      }
      update_tag_cache: {
        Args: { cache_key: string; cache_data: Json }
        Returns: boolean
      }
      validate_schema_structure: {
        Args: { target_schema: string }
        Returns: Json
      }
    }
    Enums: {
      chat_channel_type: "group" | "dm"
      org_connection_type: "current" | "former" | "connected_insider"
      post_media_type: "image" | "video" | "link"
      pricing_tier: "free" | "community" | "pro" | "partner"
      test_run_status: "success" | "failure" | "in_progress"
      test_status: "passed" | "failed" | "skipped"
      test_suite_status: "success" | "failure" | "skipped" | "in_progress"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_channel_type: ["group", "dm"],
      org_connection_type: ["current", "former", "connected_insider"],
      post_media_type: ["image", "video", "link"],
      pricing_tier: ["free", "community", "pro", "partner"],
      test_run_status: ["success", "failure", "in_progress"],
      test_status: ["passed", "failed", "skipped"],
      test_suite_status: ["success", "failure", "skipped", "in_progress"],
    },
  },
} as const
