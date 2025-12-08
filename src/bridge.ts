import type {
  HostMessage,
  InvokeMethodPayload,
  WidgetMessage,
  WidgetMessageType,
} from "./types";

const PENDING_REQUESTS = new Map<
  string,
  { resolve: (value: any) => void; reject: (reason: any) => void }
>();

const EVENT_LISTENERS = new Map<string, Set<(payload: any) => void>>();

// Listen for messages from the host
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    const data = event.data as HostMessage;
    if (!data || !data.id) return;

    // Handle Events
    if (data.type === "EVENT") {
       // For events, the id is the event name
       const eventName = data.id;
       const listeners = EVENT_LISTENERS.get(eventName);
       if (listeners) {
         listeners.forEach(callback => callback(data.payload));
       }
       return;
    }

    const request = PENDING_REQUESTS.get(data.id);
    if (request) {
      if (data.type === "RESPONSE") {
        request.resolve(data.payload);
        PENDING_REQUESTS.delete(data.id);
      } else if (data.type === "ERROR") {
        request.reject(new Error(data.error || "Unknown host error"));
        PENDING_REQUESTS.delete(data.id);
      }
      // Ignore other message types (like the echoed request itself)
    }
  });
}

export function onEvent<T = any>(eventName: string, callback: (payload: T) => void) {
  if (!EVENT_LISTENERS.has(eventName)) {
    EVENT_LISTENERS.set(eventName, new Set());
  }
  EVENT_LISTENERS.get(eventName)!.add(callback);

  return () => {
    const listeners = EVENT_LISTENERS.get(eventName);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

export function sendMessage<T>(
  type: WidgetMessageType,
  payload?: any,
  widgetId?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(7);
    PENDING_REQUESTS.set(id, { resolve, reject });

    const message: WidgetMessage = {
      id,
      widgetId,
      type,
      payload,
    };

    window.parent.postMessage(message, "*");

    setTimeout(() => {
      if (PENDING_REQUESTS.has(id)) {
        PENDING_REQUESTS.delete(id);
        reject(new Error("Request timed out"));
      }
    }, 10000);
  });
}

function createRecursiveProxy(path: string, widgetId?: string): any {
  // The proxy target is a dummy function so it can be invoked
  const dummy = () => {};
  
  return new Proxy(dummy, {
    get: (_target, prop) => {
      if (typeof prop === "string") {
        if (prop === "then") return undefined; // Avoid Promise confusion
        return createRecursiveProxy(path ? `${path}.${prop}` : prop, widgetId);
      }
      return undefined;
    },
    apply: (_target, _thisArg, args) => {
      // When invoked, we assume the LAST segment of the path is the method name,
      // and the rest is the module path.
      
      const lastDotIndex = path.lastIndexOf(".");
      if (lastDotIndex === -1) {
         throw new Error("Cannot invoke root module directly");
      }
      
      const module = path.substring(0, lastDotIndex);
      const method = path.substring(lastDotIndex + 1);
      
      return sendMessage<any>("INVOKE_METHOD", {
        module,
        method,
        args,
      } as InvokeMethodPayload, widgetId);
    }
  });
}

export function createModuleProxy<T extends object>(moduleName: string, widgetId?: string): T {
   return new Proxy({} as T, {
     get: (_target, prop) => {
       if (typeof prop === "string") {
         if (prop === "then") return undefined;
         return createRecursiveProxy(`${moduleName}.${prop}`, widgetId);
       }
       return undefined;
     }
   });
}
