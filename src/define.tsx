import type { WidgetContext } from "./types";
import { createModuleProxy, onEvent } from "./bridge";
import type { UiAPI } from "./modules/ui";
import type { StorageAPI } from "./modules/storage";
import React from "react";

export interface WidgetDefinition {
  id: string;
  version: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  config?: {
    props?: Record<string, any>;
    panel?: Record<string, any>;
  };
  setup: (context: WidgetContext) => () => React.ReactNode;
}

import { WidgetScopeProvider } from "./context";


export function defineWidget(def: WidgetDefinition) {
  const originalSetup = def.setup;

  return {
    ...def,
    sdkVersion: "2.0.0",
    setup: (initialContext: WidgetContext) => {
      // Create proxies once
      const ui = createModuleProxy<UiAPI>("ui", initialContext.widgetId);
      const storage = createModuleProxy<StorageAPI>("storage", initialContext.widgetId);

      const scopedContext = {
        ...initialContext,
        ui,
        storage,
      };

      const RenderComponent = originalSetup(scopedContext);

      // Stateful Wrapper to handle Context Updates
      return () => {
        const [context, setContext] = React.useState(initialContext);

        React.useEffect(() => {
          if (!context.widgetId) return;
          // Listen for context updates from Host (SandboxV2)
          return onEvent('context-update', (payload: any) => {
            setContext(prev => {
              const next = { ...prev, ...payload };
              return next;
            });
          }, context.widgetId);
        }, [context.widgetId]);

        const providerValue = {
          ...context,
          ui,
          storage
        };

        return (
          <WidgetScopeProvider value={providerValue}>
            <RenderComponent />
          </WidgetScopeProvider>
        );
      };
    }
  };
}
