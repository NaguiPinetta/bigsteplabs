export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: "Admin" | "Collaborator" | "Student";
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "Admin" | "Collaborator" | "Student";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "Admin" | "Collaborator" | "Student";
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          title: string;
          description: string;
          slug: string | null;
          is_published: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          slug?: string | null;
          is_published?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          slug?: string | null;
          is_published?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      units: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string | null;
          slug: string | null;
          status: "pending" | "in_progress" | "done";
          order_index: number;
          estimated_duration_minutes: number | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string | null;
          slug?: string | null;
          status?: "pending" | "in_progress" | "done";
          order_index?: number;
          estimated_duration_minutes?: number | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          description?: string | null;
          slug?: string | null;
          status?: "pending" | "in_progress" | "done";
          order_index?: number;
          estimated_duration_minutes?: number | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      content: {
        Row: {
          id: string;
          unit_id: string;
          type: "pdf" | "markdown" | "video" | "audio" | "embed" | "link";
          title: string;
          description: string | null;
          file_url: string | null;
          content: string | null;
          order_index: number;
          metadata: any;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          type: "pdf" | "markdown" | "video" | "audio" | "embed" | "link";
          title: string;
          description?: string | null;
          file_url?: string | null;
          content?: string | null;
          order_index?: number;
          metadata?: any;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          type?: "pdf" | "markdown" | "video" | "audio" | "embed" | "link";
          title?: string;
          description?: string | null;
          file_url?: string | null;
          content?: string | null;
          order_index?: number;
          metadata?: any;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      datasets: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          file_type: string | null;
          content_type: string;
          text_content: string | null;
          text_format: string | null;
          total_chunks: number;
          processing_status: string;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          content_type?: string;
          text_content?: string | null;
          text_format?: string | null;
          total_chunks?: number;
          processing_status?: string;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          content_type?: string;
          text_content?: string | null;
          text_format?: string | null;
          total_chunks?: number;
          processing_status?: string;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_chunks: {
        Row: {
          id: string;
          dataset_id: string;
          index: number;
          content: string;
          token_count: number | null;
          char_count: number | null;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          index: number;
          content: string;
          token_count?: number | null;
          char_count?: number | null;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          dataset_id?: string;
          index?: number;
          content?: string;
          token_count?: number | null;
          char_count?: number | null;
          metadata?: any;
          created_at?: string;
        };
      };
      dataset_chunks: {
        Row: {
          id: string;
          dataset_id: string;
          index: number;
          content: string;
          token_count: number | null;
          char_count: number | null;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          index: number;
          content: string;
          token_count?: number | null;
          char_count?: number | null;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          dataset_id?: string;
          index?: number;
          content?: string;
          token_count?: number | null;
          char_count?: number | null;
          metadata?: any;
          created_at?: string;
        };
      };
      personas: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          system_prompt: string;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          system_prompt: string;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          system_prompt?: string;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      models: {
        Row: {
          id: string;
          provider: string;
          name: string;
          engine: string;
          api_key_id: string | null;
          max_tokens: number;
          temperature: number;
          is_active: boolean;
          description: string | null;
          api_endpoint: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          name: string;
          engine: string;
          api_key_id?: string | null;
          max_tokens?: number;
          temperature?: number;
          is_active?: boolean;
          description?: string | null;
          api_endpoint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          name?: string;
          engine?: string;
          api_key_id?: string | null;
          max_tokens?: number;
          temperature?: number;
          is_active?: boolean;
          description?: string | null;
          api_endpoint?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          persona_id: string;
          model_id: string;
          dataset_ids: string[];
          tools: any[] | null;
          output_format: string | null;
          is_active: boolean;
          whisper_language: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          persona_id: string;
          model_id: string;
          dataset_ids?: string[];
          tools?: any[] | null;
          output_format?: string | null;
          is_active?: boolean;
          whisper_language?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          persona_id?: string;
          model_id?: string;
          dataset_ids?: string[];
          tools?: any[] | null;
          output_format?: string | null;
          is_active?: boolean;
          whisper_language?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      unit_agents: {
        Row: {
          id: string;
          unit_id: string;
          agent_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          agent_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          agent_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string | null;
          unit_id: string | null;
          status: "active" | "paused" | "ended";
          title: string | null;
          started_at: string;
          ended_at: string | null;
          message_count: number;
          metadata: any;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id?: string | null;
          unit_id?: string | null;
          status?: "active" | "paused" | "ended";
          title?: string | null;
          started_at?: string;
          ended_at?: string | null;
          message_count?: number;
          metadata?: any;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agent_id?: string | null;
          unit_id?: string | null;
          status?: "active" | "paused" | "ended";
          title?: string | null;
          started_at?: string;
          ended_at?: string | null;
          message_count?: number;
          metadata?: any;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: any;
          token_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: any;
          token_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: any;
          token_count?: number | null;
          created_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          unit_id: string;
          status: "pending" | "in_progress" | "done";
          started_at: string | null;
          completed_at: string | null;
          time_spent_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          unit_id: string;
          status?: "pending" | "in_progress" | "done";
          started_at?: string | null;
          completed_at?: string | null;
          time_spent_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          unit_id?: string;
          status?: "pending" | "in_progress" | "done";
          started_at?: string | null;
          completed_at?: string | null;
          time_spent_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          title: string;
          notion_url: string;
          embed_url?: string | null;
          module_id: string | null;
          unit_id: string | null;
          agent_id: string | null;
          content_type: string;
          order_index: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          notion_url: string;
          embed_url?: string | null;
          module_id?: string | null;
          unit_id?: string | null;
          agent_id?: string | null;
          content_type?: string;
          order_index?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          notion_url?: string;
          embed_url?: string | null;
          module_id?: string | null;
          unit_id?: string | null;
          agent_id?: string | null;
          content_type?: string;
          order_index?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Deprecated: content table (migrated to lessons)
      content: {
        Row: {
          id: string;
          title: string | null;
          description: string | null;
          file_url: string | null;
          module_id: string | null;
          unit_id: string | null;
          content_type: Json | null;
          is_published: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title?: string | null;
          description?: string | null;
          file_url?: string | null;
          module_id?: string | null;
          unit_id?: string | null;
          content_type?: Json | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string | null;
          description?: string | null;
          file_url?: string | null;
          module_id?: string | null;
          unit_id?: string | null;
          content_type?: Json | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: "Admin" | "Collaborator" | "Student";
      };
    };
    Enums: {
      user_role: "Admin" | "Collaborator" | "Student";
      unit_status: "pending" | "in_progress" | "done";
      content_type: "pdf" | "markdown" | "video" | "audio" | "embed" | "link";
      chat_session_status: "active" | "paused" | "ended";
      message_role: "user" | "assistant" | "system";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Module = Database["public"]["Tables"]["modules"]["Row"];
export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type Content = Database["public"]["Tables"]["content"]["Row"];
export type Dataset = Database["public"]["Tables"]["datasets"]["Row"];
export type ContentChunk =
  Database["public"]["Tables"]["content_chunks"]["Row"];
export type DatasetChunk =
  Database["public"]["Tables"]["dataset_chunks"]["Row"];

export type Persona = Database["public"]["Tables"]["personas"]["Row"];
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type Model = Database["public"]["Tables"]["models"]["Row"];
export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"];
export type LessonUpdate = Database["public"]["Tables"]["lessons"]["Update"];

export interface LessonWithRelations extends Lesson {
  module?: {
    id: string;
    title: string;
  };
  unit?: {
    id: string;
    title: string;
  };
  agent?: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
  };
}

// Extended types for joined data
export interface ChatSessionWithAgent extends ChatSession {
  agent?: {
    id: string;
    name: string;
    is_active: boolean;
    persona?: {
      name: string;
      system_prompt: string;
    };
    model?: {
      name: string;
      provider: string;
      engine: string;
    };
  };
}
