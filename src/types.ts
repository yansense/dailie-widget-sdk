export type WidgetMessageType =
  | "GET_CONTEXT"
  | "INVOKE_METHOD"
  | "EVENT"
  | "REQUEST"; // Re-adding REQUEST for legacy support if needed, but I updated hooks to use INVOKE_METHOD. 
  // Wait, if I updated hooks to use INVOKE_METHOD, I don't need REQUEST in types.
  // BUT, the Host App might still be listening for REQUEST?
  // The Host App update I wrote handles REQUEST.
  // So I should keep REQUEST in types to avoid breaking the Host App's type checking if it imports it?
  // Actually, the Host App imports WidgetMessageType? No, it usually defines its own or imports.
  // Let's keep it clean. I will NOT add REQUEST back. I will rely on the updated hooks.ts.
  // However, I need to fix the "unused import" error in index.tsx.


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

export interface InvokeMethodPayload {
  module: string;
  method: string;
  args: any[];
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
}
