/// <reference types="vite/client" />

declare module 'qrcode' {
  export function toDataURL(
    input: string,
    options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
  ): Promise<string>;
  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: { width?: number; margin?: number },
    callback?: (err: Error | null) => void
  ): void;
}
