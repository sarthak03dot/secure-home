export interface TelemetryData {
  motion: boolean;
  light: number;
  distance: number;
  relay_light: boolean;
  relay_fan: boolean;
  mode: string;
  uptime: number;
}

export interface LogEntry {
  id: string;
  type: string;
  value: string;
  timestamp: string;
}
