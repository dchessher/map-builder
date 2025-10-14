declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  interface Root {
    render(children: ReactNode): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;

  const ReactDOMClient: {
    createRoot: typeof createRoot;
  };

  export default ReactDOMClient;
}
