declare namespace React {
  type ReactNode = any;

  interface PropsWithChildren<P> {
    children?: ReactNode;
  }

  interface FunctionComponent<P = {}> {
    (props: P & PropsWithChildren<P>): ReactNode | null;
  }

  type FC<P = {}> = FunctionComponent<P>;

  interface MutableRefObject<T> {
    current: T;
  }

  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);

  function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useMemo<T>(factory: () => T, deps: ReadonlyArray<unknown> | undefined): T;
  function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<unknown>): void;
  function useRef<T>(initialValue: T | null): MutableRefObject<T | null>;
  function useId(): string;

  interface ForwardRefExoticComponent<P> {
    (props: P & { ref?: MutableRefObject<any> | null }): ReactNode;
    displayName?: string;
  }

  function forwardRef<T, P = {}>(
    render: (props: P, ref: MutableRefObject<T | null> | null) => ReactNode,
  ): ForwardRefExoticComponent<P>;

  interface SyntheticEvent<T = Element> {
    readonly target: T;
    readonly currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: T & { value: string };
  }
  interface MouseEvent<T = Element> extends SyntheticEvent<T> {}

  namespace JSXInternal {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  const StrictMode: FC<PropsWithChildren<unknown>>;
}

declare const React: {
  StrictMode: typeof React.StrictMode;
  useState: typeof React.useState;
  useMemo: typeof React.useMemo;
  useEffect: typeof React.useEffect;
  useRef: typeof React.useRef;
  useId: typeof React.useId;
  forwardRef: typeof React.forwardRef;
};

declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSXInternal.IntrinsicElements {}
  }
}

export = React;
export as namespace React;
