import { useEffect, useState } from "react";
import { sendMessage } from "./bridge";
import type { RequestOptions, WidgetContext } from "./types";

export function useWidgetContext() {
  const [context, setContext] = useState<WidgetContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    sendMessage<WidgetContext>("GET_CONTEXT")
      .then(setContext)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { context, loading, error };
}

export function useStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    sendMessage<T>("GET_STORAGE", { key })
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
      await sendMessage("SET_STORAGE", { key, value: newValue });
      setValue(newValue);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { value, setValue: setStorageValue, loading, error };
}

export async function request<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  return sendMessage<T>("REQUEST", { url, options });
}
