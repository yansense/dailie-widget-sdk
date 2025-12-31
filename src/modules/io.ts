import { createModuleProxy } from "../bridge";

export interface IoAPI {
  setOutput(data: any): Promise<void>;
}

export const io = createModuleProxy<IoAPI>("io");
