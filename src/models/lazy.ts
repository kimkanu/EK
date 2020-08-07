export type Lazy<T> = LazyLoaded<T> | LazyNotLoaded;
export type LazyLoaded<T> = {
  type: 'loaded';
  inner: T;
};
export function lazyLoaded<T>(inner: T): LazyLoaded<T> {
  return {
    type: 'loaded',
    inner,
  };
}
export type LazyNotLoaded = {
  type: 'not-loaded';
}
export function lazyNotLoaded<T>(): LazyNotLoaded {
  return {
    type: 'not-loaded',
  };
}

export function lazyToNullable<T>(lazy: Lazy<T>): T | null {
  return lazy.type === 'not-loaded' ? null : lazy.inner;
}
