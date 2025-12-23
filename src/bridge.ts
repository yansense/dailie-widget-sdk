import type {
  HostMessage,
  InvokeMethodPayload,
  WidgetMessage,
  WidgetMessageType,
} from "./types";

interface EventListener {
  callback: (payload: any) => void;
  widgetId?: string;
}

// Global Singleton Interface
interface BridgeSingleton {
  pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }>;
  eventListeners: Map<string, Set<EventListener>>;
  initialized: boolean;
  init: () => void;
}

// Get or Create Singleton
const getBridge = (): BridgeSingleton => {
    if (typeof window === "undefined") {
        return {
            pendingRequests: new Map(),
            eventListeners: new Map(),
            initialized: false,
            init: () => {}
        };
    }

    const key = "__DAILIE_BRIDGE_V2__";
    if (!(window as any)[key]) {
        const bridge: BridgeSingleton = {
            pendingRequests: new Map(),
            eventListeners: new Map(),
            initialized: false,
            init: () => {
                if (bridge.initialized) {
                    console.log("[SDK-Singleton] Already initialized, skipping listener attachment.");
                    return;
                }
                console.log("[SDK-Singleton] Initializing Global Message Listener");
                window.addEventListener("message", (event) => {
                    const data = event.data as HostMessage;
                    if (!data || !data.id) return;
                
                    // Handle Events
                    if (data.type === "EVENT") {
                       console.log(`[SDK-Singleton] Received EVENT [${data.id}] for widget [${data.widgetId || 'global'}]. Disptaching to ${bridge.eventListeners.get(data.id)?.size || 0} listeners.`);
                       const eventName = data.id;
                       const listeners = bridge.eventListeners.get(eventName);
                       
                       if (listeners) {
                         listeners.forEach(listener => {
                            if (listener.widgetId && data.widgetId && listener.widgetId !== data.widgetId) {
                               console.log(`[SDK-Singleton] Skipping listener for widget [${listener.widgetId}] vs msg [${data.widgetId}] - mismatch`);
                               return; 
                            }
                            console.log(`[SDK-Singleton] Invoking listener for widget [${listener.widgetId || 'global'}]`);
                            try {
                                listener.callback(data.payload);
                            } catch (e) {
                                console.error("[SDK-Singleton] Listener callback failed:", e);
                            }
                         });
                       }
                       return;
                    }
                
                    const request = bridge.pendingRequests.get(data.id);
                    if (request) {
                      if (data.type === "RESPONSE") {
                        request.resolve(data.payload);
                        bridge.pendingRequests.delete(data.id);
                      } else if (data.type === "ERROR") {
                        request.reject(new Error(data.error || "Unknown host error"));
                        bridge.pendingRequests.delete(data.id);
                      }
                    }
                });
                bridge.initialized = true;
            }
        };
        (window as any)[key] = bridge;
    }
    return (window as any)[key];
};

const bridge = getBridge();
// Initialize the global listener immediately if in browser
if (typeof window !== "undefined") {
    bridge.init();
}

export function onEvent<T = any>(eventName: string, callback: (payload: T) => void, widgetId?: string) {
  if (!bridge.eventListeners.has(eventName)) {
    bridge.eventListeners.set(eventName, new Set());
  }
  
  const listener: EventListener = { callback, widgetId };
  bridge.eventListeners.get(eventName)!.add(listener);

  return () => {
    const listeners = bridge.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(listener);
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
    bridge.pendingRequests.set(id, { resolve, reject });

    const message: WidgetMessage = {
      id,
      widgetId: widgetId || (window as any).__DAILIE_WIDGET_ID__,
      type,
      payload,
    };

    console.log("[SDK-Bridge] Sending Message:", message);
    window.parent.postMessage(message, "*");

    setTimeout(() => {
      if (bridge.pendingRequests.has(id)) {
        bridge.pendingRequests.delete(id);
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
