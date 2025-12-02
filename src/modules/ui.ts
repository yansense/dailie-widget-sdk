import { createModuleProxy } from "../bridge";

export interface ToastAPI {
  success(message: string): Promise<void>;
  error(message: string): Promise<void>;
  info(message: string): Promise<void>;
  warning(message: string): Promise<void>;
}

export interface UiAPI {
  alert(message: string): Promise<void>;
  confirm(message: string): Promise<boolean>;
  toast: ToastAPI;
}

export const ui = createModuleProxy<UiAPI>("ui");
