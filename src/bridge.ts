import type { HostMessage, WidgetMessage, WidgetMessageType } from "./types";

const PENDING_REQUESTS = new Map<
  string,
  { resolve: (value: any) => void; reject: (reason: any) => void }
>();

// Listen for messages from the host
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    const data = event.data as HostMessage;
    if (!data || !data.id) return;

    const request = PENDING_REQUESTS.get(data.id);
    if (request) {
      if (data.type === "RESPONSE") {
        request.resolve(data.payload);
      } else if (data.type === "ERROR") {
        request.reject(new Error(data.error || "Unknown host error"));
      }
      PENDING_REQUESTS.delete(data.id);
    }
  });
}

export function sendMessage<T>(
  type: WidgetMessageType,
  payload?: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(7);
    PENDING_REQUESTS.set(id, { resolve, reject });

    const message: WidgetMessage = {
      id,
      type,
      payload,
    };

    // In a real scenario, we might want to target a specific origin
    // For now, '*' is acceptable as the iframe is sandboxed
    window.parent.postMessage(message, "*");

    // Timeout after 10 seconds
    setTimeout(() => {
      if (PENDING_REQUESTS.has(id)) {
        PENDING_REQUESTS.delete(id);
        reject(new Error("Request timed out"));
      }
    }, 10000);
  });
}
