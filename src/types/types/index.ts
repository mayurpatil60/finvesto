// ─── Type Aliases ─────────────────────────────────────────────────────────────

import type { IUser } from "../interfaces";
import type { ApiStatus } from "../enums";

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<{ data: T | null; error: string | null }>;

export type UserState = {
  user: Nullable<IUser>;
  status: ApiStatus;
  error: Nullable<string>;
};

export type NavigationParams = {
  [routeName: string]: Record<string, unknown> | undefined;
};
