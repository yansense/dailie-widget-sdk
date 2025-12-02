# Module Development Guide

This guide explains how to add new modules to the Dailie Widget SDK.

## Architecture

The SDK uses a generic RPC protocol (`INVOKE_METHOD`) to communicate with the Host App.
- **SDK Side**: Uses a `Proxy` to convert method calls into message payloads.
- **Host Side**: Uses a Registry to map module names to handler functions.

## Steps to Add a New Module

### 1. Define the Interface (SDK)

Create a new file in `src/modules/[module-name].ts`. Define the TypeScript interface for your module.

\`\`\`ts
// src/modules/clipboard.ts
import { createModuleProxy } from "../bridge";

export interface ClipboardAPI {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

export const clipboard = createModuleProxy<ClipboardAPI>("clipboard");
\`\`\`

### 2. Export the Module (SDK)

Update `src/index.tsx` to export your new module.

\`\`\`ts
// src/index.tsx
import { clipboard } from "./modules/clipboard";

export const widget = {
  // ... other modules
  clipboard,
};
\`\`\`

### 3. Implement the Handler (Host App)

In the Host App (`dailie-web`), update `useWidgetBridge.ts` to handle the new module.

\`\`\`ts
// src/hooks/useWidgetBridge.ts

const modules = useRef({
  // ... other modules
  clipboard: async (method, args) => {
    switch (method) {
      case "writeText":
        await navigator.clipboard.writeText(args[0]);
        return;
      case "readText":
        return await navigator.clipboard.readText();
      default:
        throw new Error(\`Method \${method} not found\`);
    }
  }
});
\`\`\`

### 4. Mock for Development (Widget Template)

Update `setup.js` in `dailie-widget-template` to mock the new module for local development.

\`\`\`js
// setup.js
if (module === "clipboard") {
  if (method === "writeText") {
    console.log("Mock Clipboard Write:", args[0]);
    sendResponse();
  }
}
\`\`\`
