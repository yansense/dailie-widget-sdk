import { storage } from "./modules/storage";
import { ui } from "./modules/ui";


export * from "./types";
export * from "./hooks";
export { sendMessage } from "./bridge";

// Export modules
export const widget = {
  storage,
  ui,
};

// Re-export specific modules if needed
export { storage, ui };
