import React, { createContext, useContext } from "react";

export const WidgetIdContext = createContext<string | undefined>(undefined);

export const WidgetScopeProvider: React.FC<{
  id?: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  return (
    <WidgetIdContext.Provider value={id}>{children}</WidgetIdContext.Provider>
  );
};

export function useWidgetId() {
  return useContext(WidgetIdContext);
}
