import { createModuleProxy } from "./bridge";
import { storage, type StorageAPI } from "./modules/storage";
import { ui, type UiAPI } from "./modules/ui";


export * from "./types";
export * from "./hooks";
export * from "./context";
export { sendMessage } from "./bridge";

// Export modules
export const widget = {
  storage,
  ui,
};

// Re-export specific modules if needed
export { storage, ui };

export function scope(widgetId: string) {
  return {
    ui: createModuleProxy<UiAPI>("ui", widgetId),
    storage: createModuleProxy<StorageAPI>("storage", widgetId),
  };
}
