import type { WidgetContext } from "./types";
import { createModuleProxy, onEvent } from "./bridge";
import type { UiAPI } from "./modules/ui";
import type { StorageAPI } from "./modules/storage";
import type { IoAPI } from "./modules/io";
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
    schema: any; // Zod schema
  };
  io?: {
    input?: any; // Zod schema
    output?: any; // Zod schema
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
      const io = createModuleProxy<IoAPI>("io", initialContext.widgetId);

      const scopedContext = {
        ...initialContext,
        ui,
        storage,
        io,
      };

      const RenderComponent = originalSetup(scopedContext);

      // Memoize RenderComponent to prevent unnecessary re-mounts
      const MemoizedRenderComponent = React.memo(RenderComponent);

      // Stateful Wrapper to handle Context Updates
      return () => {
        const [context, setContext] = React.useState(initialContext);

        // Listen for context updates - use initialContext.widgetId to avoid re-subscribing
        React.useEffect(() => {
          if (!initialContext.widgetId) return;

          console.log('[defineWidget] Setting up event listener for widgetId:', initialContext.widgetId);

          const unsubscribe = onEvent('context-update', (payload: any) => {
            console.log('[defineWidget] Event received! widgetId:', initialContext.widgetId);
            console.log('[defineWidget] Payload:', payload);
            console.log('[defineWidget] payload.gridSize:', payload.gridSize, 'payload.widgetStyle:', payload.widgetStyle);

            setContext(prevContext => {
              console.log('[defineWidget] Updating context from:', prevContext.gridSize, 'to:', payload.gridSize);
              return payload; // Directly use payload as new context
            });
          }, initialContext.widgetId);

          return () => {
            console.log('[defineWidget] Cleaning up event listener for widgetId:', initialContext.widgetId);
            unsubscribe();
          };
        }, [initialContext.widgetId]); // Only depend on initial widgetId

        // Log whenever context changes
        React.useEffect(() => {
          console.log('[defineWidget] Context state is now:', context.gridSize, context.widgetStyle);
        }, [context]);

        // Stabilize object fields to prevent unnecessary re-renders
        const dimensions = React.useMemo(() => context.dimensions, [
          context.dimensions?.width,
          context.dimensions?.height
        ]);

        const config = React.useMemo(() => context.config, [
          JSON.stringify(context.config) // Simple deep comparison via JSON
        ]);

        const inputs = React.useMemo(() => context.inputs, [
          JSON.stringify(context.inputs)
        ]);

        // Memoize individual context fields to prevent unnecessary Provider updates
        const providerValue = React.useMemo(() => {
          return {
            widgetId: context.widgetId,
            theme: context.theme,
            gridSize: context.gridSize,
            dimensions,
            config,
            inputs,
            widgetStyle: context.widgetStyle,
            ui,
            storage,
            io
          };
        }, [
          context.widgetId,
          context.theme,
          context.gridSize,
          dimensions,
          config,
          inputs,
          context.widgetStyle,
          ui,
          storage,
          io
        ]); // Depend on individual fields, not entire context object

        return (
          <WidgetScopeProvider value={providerValue}>
            <MemoizedRenderComponent />
          </WidgetScopeProvider>
        );
      };
    }
  };
}
