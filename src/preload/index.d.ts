import type { OttoBridge } from "@shared/ipc";

declare global {
  interface Window {
    otto: OttoBridge;
  }
}

export {};
