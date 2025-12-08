import { useEffect, useState, useMemo } from "react";
import { sendMessage, onEvent, createModuleProxy } from "./bridge";
import { storage, type StorageAPI } from "./modules/storage";
import type { WidgetContext } from "./types";
import { useWidgetId } from "./context";

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
      console.log("[SDK] useWidgetContext received update:", newContext);
      setContext(newContext);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { context, loading, error };
}

export function useConfig<T = any>(): T {
  const { context } = useWidgetContext();
  const [config, setConfig] = useState<T>({} as T);

  useEffect(() => {
    if (context?.config) {
      setConfig(context.config);
    }
  }, [context?.config]);

  useEffect(() => {
    const unsubscribe = onEvent<T>("config-update", (newConfig) => {
      console.log("[SDK] useConfig received update:", newConfig);
      setConfig(newConfig);
    });
    return () => unsubscribe();
  }, []);

  return config;
}

export function useStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const widgetId = useWidgetId();
  
  // Create a scoped storage instance if widgetId is present, otherwise use global
  const storageInstance = useMemo(() => {
      if (widgetId) {
          // We need to import createModuleProxy dynamically or from bridge
          // But since we are in hooks.ts, we can import it.
          // However, we need to cast it to StorageAPI
          return createModuleProxy<StorageAPI>("storage", widgetId);
      }
      return storage;
  }, [widgetId]);

  useEffect(() => {
    storageInstance.local.getItem<T>(key)
      .then((val) => {
        if (val !== undefined) {
          setValue(val);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key, storageInstance]);

  const setStorageValue = async (newValue: T) => {
    try {
      await storageInstance.local.setItem(key, newValue);
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
