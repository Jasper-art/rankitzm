declare module '*.css';
interface ImportMeta {
  readonly env: {
    readonly VITE_GROQ_API_KEY: string;
    [key: string]: string | undefined;
  };
}