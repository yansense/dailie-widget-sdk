import { createModuleProxy } from "./bridge";
import { storage, type StorageAPI } from "./modules/storage";
import { ui, type UiAPI } from "./modules/ui";

export * from "./types";
export * from "./hooks";
export * from "./context";
export * from "./bridge";
// Export new Definition API
export * from "./define";
export * from "./utils";

// Legacy exports for backward compatibility (optional, or remove if strictly breaking)
// We are removing the old defineWidget to enforce V2 usage for this version.
// Old widgets should stick to v0.x or v1.x.

// Export modules
export const widget = {
  storage,
  ui,
};

// Re-export specific modules if needed
export { storage, ui };

// Need to bind the rest of the SDK to the scoped object
// However, 'this' context or circular dependency might be tricky with "export *".
// Better to export a helper that clones the SDK object if possible.
// Since we can't easily capture "all exports" inside the module itself without a circular reference object,
// we might rely on the Host (injector) to do the spreading.

// BUT, the injector uses `(DailieWidgetSdk as any).scope(widgetId)`.
// Result is assigned to `sdk` global.
// If we return just { ui, storage }, the global `sdk` lacks others.

// Solution: The scope function should probably NOT be responsible for returning the *entire* SDK if it can't access it easily.
// OR we construct an object `sdk` in this file and export it.

// Let's modify the file structure slightly to export a default object or named exports that we can reference.

// ALTERNATIVE: Access the current module's exports via a namespace import * inside the file? No.

// SIMPLE FIX: In `injector.ts`, we shouldn't just replace the SDK with the result of scope().
// We should merge them. `const scopedSdk = { ...DailieWidgetSdk, ...DailieWidgetSdk.scope(widgetId) }`.

// So I will fix this in `injector.ts` in dailie-web.
// BUT I should also check if `scope` needs to be doing anything else.
// `scope` return { ui, storage } is fine if the consumer merges it.
// I'll keep this file as is (just verify) and fix injector.ts.

// Wait, I am in `dailie-widget-sdk/src/index.tsx`.
// It is better if `scope` returns the full thing if possible, but simpler if injector merges.
// Let's stick to injector merge.

// Internal helper for Host (injector) to create a scoped SDK instance.
// @internal - Not for public usage by widget developers.
export function __internal_scope(widgetId: string) {
  return {
    ui: createModuleProxy<UiAPI>("ui", widgetId),
    storage: createModuleProxy<StorageAPI>("storage", widgetId),
  };
}

// Test utility to verify SDK bundling
export function getSDKInfo() {
  return {
    version: "2.0.0-alpha.6",
    bundled: true,
    timestamp: new Date().toISOString(),
    message: "🎯 This SDK is BUNDLED into the widget (V2)!"
  };
}
