export type Result<P, E = Error> = Ok<P> | Err<E>;
export type Ok<P> = {
  type: 'ok';
  inner: P;
};
export type Err<E = Error> = {
  type: 'err';
  inner: E;
};

export function ok<P>(inner: P): Ok<P> {
  return {
    type: 'ok',
    inner,
  };
}

export function err<E>(inner: E): Err<E> {
  return {
    type: 'err',
    inner,
  };
}
