export type Role = "Admin" | "Collaborator" | "Student";

export interface User {
  id: string;
  email: string;
  role: Role;
  created_at?: string;
  updated_at?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  slug?: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

export type UnitStatus = "pending" | "in_progress" | "done";

export interface Unit {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  status: UnitStatus;
  order_index: number;
  created_at: string;
  updated_at?: string;
  module?: Module;
}

export type ContentType =
  | "pdf"
  | "markdown"
  | "video"
  | "audio"
  | "embed"
  | "link";

export interface Content {
  id: string;
  unit_id: string;
  type: ContentType;
  title: string;
  description?: string;
  file_url?: string;
  content?: string; // For markdown
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  unit?: Unit;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  file_url?: string;
  total_chunks?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  user?: User;
}

export interface ContentChunk {
  id: string;
  dataset_id: string;
  index: number;
  content: string;
  token_count?: number;
  char_count?: number;
  metadata?: Record<string, any>;
  created_at: string;
  dataset?: Dataset;
}

export interface Persona {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  created_at: string;
  updated_at?: string;
}

export interface Model {
  id: string;
  provider: string;
  name: string;
  engine: string;
  api_key_id?: string;
  max_tokens?: number;
  temperature?: number;
  created_at: string;
  updated_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  persona_id: string;
  model_id: string;
  dataset_ids: string[];
  tools?: Record<string, any>[];
  output_format?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  persona?: Persona;
  model?: Model;
  datasets?: Dataset[];
}

export type ChatSessionStatus = "active" | "paused" | "ended";

export interface ChatSession {
  id: string;
  user_id: string;
  agent_id?: string;
  unit_id?: string;
  status: ChatSessionStatus;
  started_at: string;
  ended_at?: string;
  message_count?: number;
  user?: User;
  agent?: Agent;
  unit?: Unit;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  session?: ChatSession;
}
