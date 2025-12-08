export type WidgetMessageType =
  | "GET_CONTEXT"
  | "INVOKE_METHOD"
  | "EVENT";

export interface WidgetMessage<T = any> {
  id: string;
  widgetId?: string;
  type: WidgetMessageType;
  payload?: T;
}

export interface HostMessage<T = any> {
  id: string;
  type: "RESPONSE" | "ERROR" | "EVENT";
  payload?: T;
  error?: string;
}

export interface InvokeMethodPayload {
  module: string;
  method: string;
  args: any[];
}

export interface WidgetContext {
  widgetId?: string;
  theme: "light" | "dark";
  gridSize: string; // e.g. "1x1", "2x2"
  dimensions: {
    width: number;
    height: number;
  };
  user?: {
    id: string;
    name: string;
  };
}
