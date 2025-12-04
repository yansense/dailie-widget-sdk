# Dailie Widget SDK

A React SDK for building interactive widgets on the Dailie platform.

## 🚀 Quick Start

```bash
pnpm add dailie-widget-sdk
```

```tsx
import { useWidgetContext, ui, storage } from "dailie-widget-sdk";

export default function MyWidget() {
  const { context } = useWidgetContext();

  return (
    <div>
      <h1>Hello Widget!</h1>
      <button onClick={() => ui.alert("Hello!")}>
        Click Me
      </button>
    </div>
  );
}
```

## 📚 Documentation

- **[English Documentation](./docs/usage-guide-en.md)** - Comprehensive usage guide in English
- **[中文文档](./docs/usage-guide-zh.md)** - 完整的中文使用指南

## ✨ Features

- 🎣 **React Hooks** - `useWidgetContext`, `useStorage` for reactive state management
- 💾 **Storage API** - Local and session storage with type safety
- 🎨 **UI Components** - Alert, confirm dialogs, and toast notifications
- 🌗 **Theme Support** - Automatic light/dark theme adaptation
- 📐 **Responsive** - Built-in support for different widget sizes
- 🔌 **Bridge Pattern** - Seamless communication with host application

## 📦 Core APIs

### Hooks

```tsx
// Get widget context (theme, dimensions, user info)
const { context, loading, error } = useWidgetContext();

// Reactive storage hook
const { value, setValue } = useStorage<number>("counter", 0);
```

### Storage

```tsx
// Local storage (persistent)
await storage.local.setItem("key", value);
const data = await storage.local.getItem<Type>("key");

// Session storage (temporary)
await storage.session.setItem("temp", data);
```

### UI

```tsx
// Dialogs
await ui.alert("Message");
const confirmed = await ui.confirm("Are you sure?");

// Toast notifications
ui.toast.success("Saved!");
ui.toast.error("Failed!");
ui.toast.info("Info");
ui.toast.warning("Warning");
```

## 🏗️ Architecture

The SDK uses a **bridge pattern** to enable communication between widgets and the host application:

- **Widget Side**: Uses SDK APIs (this package)
- **Bridge Layer**: Message passing via `postMessage`
- **Host Side**: Module implementations in `dailie-web/src/bridge`

## 🔗 Related Projects

- **[dailie-widget-template](../dailie-widget-template)** - Template for creating new widgets
- **[dailie-web](../dailie-web)** - Host application with bridge implementations

## 📄 License

MIT

---

**Version**: 0.0.0  
**Maintainer**: Dailie Team
