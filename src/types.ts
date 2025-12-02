export type WidgetMessageType =
  | "GET_CONTEXT"
  | "SET_STORAGE"
  | "GET_STORAGE"
  | "REQUEST"
  | "RESIZE";

export interface WidgetMessage<T = any> {
  id: string;
  type: WidgetMessageType;
  payload?: T;
}

export interface HostMessage<T = any> {
  id: string;
  type: "RESPONSE" | "ERROR" | "EVENT";
  payload?: T;
  error?: string;
}

export interface WidgetContext {
  theme: "light" | "dark";
  dimensions: {
    width: number;
    height: number;
  };
  user?: {
    id: string;
    name: string;
  };
  // Add more context as needed
}

export interface RequestOptions extends RequestInit {
  // Add specific options if needed
}
