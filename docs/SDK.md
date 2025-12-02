# Widget SDK Documentation

The `@dailie/widget-sdk` provides a set of tools and modules for building widgets that run securely within the Dailie platform.

## Installation

\`\`\`bash
npm install @dailie/widget-sdk
\`\`\`

## Core Concepts

### Widget Context

Access the environment context (theme, dimensions, user info) using `useWidgetContext`.

\`\`\`tsx
import { useWidgetContext } from "@dailie/widget-sdk";

const MyWidget = () => {
  const { context, loading } = useWidgetContext();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Theme: {context.theme}</div>;
};
\`\`\`

## Modules

The SDK is organized into modules. Access them via the `widget` object.

### Storage Module (`widget.storage`)

Persist data securely on the host. Supports `local` and `session` storage.

#### Local Storage (`widget.storage.local`)

Persists even after the browser is closed.

- **`getItem<T>(key: string): Promise<T | undefined>`**
- **`setItem<T>(key: string, value: T): Promise<void>`**
- **`removeItem(key: string): Promise<void>`**

\`\`\`ts
import { widget } from "@dailie/widget-sdk";

// Save data
await widget.storage.local.setItem("count", 42);

// Read data
const count = await widget.storage.local.getItem<number>("count");
\`\`\`

#### Session Storage (`widget.storage.session`)

Persists only for the current session.

\`\`\`ts
await widget.storage.session.setItem("temp", "value");
\`\`\`

### UI Module (`widget.ui`)

Interact with the host UI.

- **`alert(message: string): Promise<void>`**
- **`confirm(message: string): Promise<boolean>`**

#### Toast (`widget.ui.toast`)

Display transient messages.

- **`success(message: string): Promise<void>`**
- **`error(message: string): Promise<void>`**
- **`info(message: string): Promise<void>`**
- **`warning(message: string): Promise<void>`**

\`\`\`ts
import { widget } from "@dailie/widget-sdk";

await widget.ui.toast.success("Saved successfully!");
await widget.ui.toast.error("Something went wrong.");
\`\`\`
