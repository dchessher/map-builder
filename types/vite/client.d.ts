interface ViteImportMetaEnvFallback {
  readonly [key: string]: string | undefined;
}

type ViteGlobEagerResult<T = unknown> = Record<string, T>;

declare global {
  interface ImportMetaEnv extends ViteImportMetaEnvFallback {}

  interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly glob: <T = unknown>(
      pattern: string,
      options?: {
        eager?: boolean;
        import?: string | string[];
        as?: 'raw' | 'url';
      },
    ) => ViteGlobEagerResult<T>;
  }
}

export {};
