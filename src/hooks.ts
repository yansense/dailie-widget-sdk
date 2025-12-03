import { useEffect, useState } from "react";
import { sendMessage, onEvent } from "./bridge";
import { storage } from "./modules/storage";
import type { WidgetContext } from "./types";

export function useWidgetContext() {
  const [context, setContext] = useState<WidgetContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    sendMessage<WidgetContext>("GET_CONTEXT")
      .then(setContext)
      .catch(setError)
      .finally(() => setLoading(false));

    // Listen for updates
    const unsubscribe = onEvent<WidgetContext>("context-update", (newContext) => {
      setContext(newContext);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { context, loading, error };
}

export function useStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    storage.getItem<T>(key)
      .then((val) => {
        if (val !== undefined) {
          setValue(val);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key]);

  const setStorageValue = async (newValue: T) => {
    try {
      await storage.setItem(key, newValue);
      setValue(newValue);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { value, setValue: setStorageValue, loading, error };
}

// Deprecated: Use a proper network module in the future
export async function request<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // For now, we can map this to a "network" module or keep it as a special case
  // But since we removed "REQUEST" from types, we should use INVOKE_METHOD
  // or add "REQUEST" back to types if we want to keep it simple.
  // Let's assume we have a "network" module for consistency.
  // return network.fetch(url, options);
  
  // OR: Re-add REQUEST to types for backward compatibility during migration.
  // Given the user wants "modular", let's use a "network" module concept, 
  // but for now I will just re-add REQUEST to types to fix the build quickly 
  // and then maybe migrate it.
  
  // Actually, let's use generic INVOKE_METHOD for "network" module
  return sendMessage<T>("INVOKE_METHOD", {
      module: "network",
      method: "fetch",
      args: [url, options]
  });
}
