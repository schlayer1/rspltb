/// <reference types="vite/client" />

declare module 'pdfjs-dist/build/pdf.mjs' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(src: any): {
    promise: Promise<any>;
  };
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const src: string;
  export default src;
}

declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}
