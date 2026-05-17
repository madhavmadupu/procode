export type Result<T, E = Error> = OkResult<T> | ErrResult<E>;

export interface OkResult<T> {
  ok: true;
  value: T;
}

export interface ErrResult<E> {
  ok: false;
  error: E;
}

export function Ok<T>(value: T): OkResult<T> {
  return { ok: true, value };
}

export function Err<E = Error>(error: E): ErrResult<E> {
  return { ok: false, error };
}
