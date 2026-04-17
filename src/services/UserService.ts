// ─── User Service ─────────────────────────────────────────────────────────────

import { BaseService } from "./BaseService";
import { UserModel } from "../types/models/UserModel";

export class UserService extends BaseService {
  private static instance: UserService;

  private constructor() {
    super();
  }

  /** Singleton — same pattern as Angular's providedIn: 'root'. */
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /** Placeholder: replace with real API call when backend is ready. */
  async getCurrentUser(): Promise<UserModel> {
    return Promise.resolve(
      new UserModel({ id: "1", name: "Mayur", email: "mayur@finvesto.com" }),
    );
  }
}
