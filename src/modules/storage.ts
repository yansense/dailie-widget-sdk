import { createModuleProxy } from "../bridge";

export interface StorageArea {
  getItem<T>(key: string): Promise<T | undefined>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface StorageAPI {
  local: StorageArea;
  session: StorageArea;
  // Legacy support or root level shortcuts if desired
  getItem<T>(key: string): Promise<T | undefined>;
  setItem<T>(key: string, value: T): Promise<void>;
}

export const storage = createModuleProxy<StorageAPI>("storage");
