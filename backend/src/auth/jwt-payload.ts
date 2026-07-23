import { Role } from '@prisma/client';

export interface JwtPayload {
  /** user id */
  sub: string;
  email: string;
  role: Role;
}

/** Express Request augmented with the decoded JWT after a guard runs. */
export interface AuthenticatedRequest {
  user?: JwtPayload;
  headers: Record<string, string | string[] | undefined>;
}
