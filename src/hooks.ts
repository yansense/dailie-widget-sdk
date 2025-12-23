import { useEffect, useState, useMemo } from "react";
import { sendMessage, onEvent, createModuleProxy } from "./bridge";
import { storage, type StorageAPI } from "./modules/storage";
import type { WidgetContext } from "./types";
import { useWidgetId, useWidgetScope } from "./context";

// Default context to prevent null crashes
const DEFAULT_CONTEXT: WidgetContext = {
  widgetId: "",
  gridSize: "2x2",
  theme: "light",
  dimensions: { width: 240, height: 240 },
  config: {}
};

export function useWidgetContext() {
  // 1. Try to get context from Scope Provider (V2 injection)
  const scoped = useWidgetScope();
  
  // Internal state for V1 fallback or standalone mode
  const [internalContext, setInternalContext] = useState<WidgetContext>(DEFAULT_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const widgetId = (scoped.widgetId || internalContext.widgetId) as string;

  // If we have scoped context with data, we use it directly!
  // BUT we need to make sure the type matches WidgetContext.
  // The 'scoped' object from defineWidget includes EVERYTHING.
  
  const isV2 = !!scoped.widgetId;

  // Effect for V1 / Fallback only
  useEffect(() => {
    if (isV2) {
        setLoading(false);
        return;
    }

    // Initial fetch - pass widgetId to identify source
    sendMessage<WidgetContext>("GET_CONTEXT", undefined, widgetId)
      .then((ctx) => {
        if (ctx) setInternalContext(ctx);
      })
      .catch(setError)
      .finally(() => setLoading(false));

    // Listen for updates
    const unsubscribe = onEvent<WidgetContext>("context-update", (newContext) => {
      console.log("[SDK] useWidgetContext (V1) received update:", newContext);
      setInternalContext(newContext);
    }, widgetId);

    return () => {
      unsubscribe();
    };
  }, [widgetId, isV2]);

  // Merge: Prefer scoped (Provider) > internal > default
  // Note: scoped might be Partial, so we merge carefully
  const activeContext: WidgetContext = isV2 ? {
      widgetId: scoped.widgetId || "",
      gridSize: scoped.gridSize || "2x2",
      theme: (scoped.theme as any) || "light",
      dimensions: scoped.dimensions || { width: 300, height: 300 },
      config: scoped.config || {},
  } : internalContext;

  return { context: activeContext, loading, error };
}

export function useConfig<T = any>(): T {
  const { context } = useWidgetContext();
  const [config, setConfig] = useState<T>({} as T);
  const widgetId = useWidgetId();

  useEffect(() => {
    if (context?.config) {
      setConfig(context.config);
    }
  }, [context?.config]);

  useEffect(() => {
    const unsubscribe = onEvent<T>("config-update", (newConfig) => {
      console.log("[SDK] useConfig received update:", newConfig);
      setConfig(newConfig);
    }, widgetId);
    return () => unsubscribe();
  }, [widgetId]);

  return config;
}

export function useStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { widgetId, storage: scopedStorage } = useWidgetScope();
  
  // Create a scoped storage instance if widgetId is present, otherwise use global
  const storageInstance = useMemo(() => {
      // Prioritize scoped storage from context (bundled SDK V2)
      if (scopedStorage) return scopedStorage;
      
      if (widgetId) {
          // Dynamic import fallback or create proxy
          return createModuleProxy<StorageAPI>("storage", widgetId);
      }
      return storage;
  }, [widgetId, scopedStorage]);

  useEffect(() => {
    storageInstance.local.getItem<T>(key)
      .then((val: T | undefined) => {
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
