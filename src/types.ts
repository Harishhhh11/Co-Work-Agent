export interface AgentStep {
  id: string;
  title: string;
  action_type: string;
  params: Record<string, any>;
  verification: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  duration_ms?: number;
  confidence?: number;
  thought?: string;
}

export interface AgentReasoning {
  intent: string;
  scratch_mode: boolean;
  apps_targeted: string[];
  safety_level: 'safe' | 'sensitive' | 'elevated';
  thought_process: string[];
}

export interface UIAElement {
  id?: string;
  name: string;
  control_type: string;
  automation_id: string;
  rect: { x: number; y: number; width: number; height: number };
  center_x: number;
  center_y: number;
}

export interface ActiveWindowInfo {
  title: string;
  process: string;
  rect: { x: number; y: number; width: number; height: number };
  buffer_text?: string;
  scratch_mode?: boolean;
}

export interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'action' | 'verify' | 'alert';
}

export interface AgentState {
  status: 'idle' | 'planning' | 'running' | 'paused' | 'waiting_confirmation' | 'stopped' | 'completed';
  goal: string;
  current_step: number;
  steps: AgentStep[];
  reasoning?: AgentReasoning;
  pending_confirmation: {
    id: string;
    action_type: string;
    description: string;
    params: Record<string, any>;
  } | null;
  active_window: ActiveWindowInfo;
  screen_resolution: [number, number];
  cursor_pos: [number, number];
  is_input_frozen?: boolean;
  freeze_enabled?: boolean;
  speed?: 'observable' | 'normal' | 'fast';
  ocr_confidence?: number;
  logs: LogEntry[];
}
