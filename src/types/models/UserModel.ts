// ─── User Model ───────────────────────────────────────────────────────────────

import type { IUser } from "../interfaces";

export class UserModel implements IUser {
  id: string;
  name: string;
  email: string;

  constructor(data: IUser) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
  }

  getDisplayName(): string {
    return this.name;
  }

  static fromJson(json: Record<string, unknown>): UserModel {
    return new UserModel({
      id: String(json["id"] ?? ""),
      name: String(json["name"] ?? ""),
      email: String(json["email"] ?? ""),
    });
  }

  toJson(): Record<string, unknown> {
    return { id: this.id, name: this.name, email: this.email };
  }
}
