import { User } from "../../session/session";

export type { User };

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

