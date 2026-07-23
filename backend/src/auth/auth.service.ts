import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt-payload';

export interface TokenResponse {
  token: string;
  role: Role;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sign(user: Pick<User, 'id' | 'email' | 'role'>): TokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return { token: this.jwt.sign(payload), role: user.role, email: user.email };
  }

  /**
   * Public signup. The first user ever created becomes ADMIN; everyone else USER.
   * Duplicate email -> 409.
   */
  async signup(email: string, password: string): Promise<TokenResponse> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.USER;
    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email: normalized, password: hash, role },
    });
    return this.sign(user);
  }

  /** User login. Bad credentials / unknown email -> 401. */
  async login(email: string, password: string): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.sign(user);
  }

  /**
   * Admin login. Validates credentials AND that the account is an ADMIN.
   * Any failure -> 401 (never reveals whether the email exists / is admin).
   */
  async adminLogin(email: string, password: string): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.password || user.role !== Role.ADMIN) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.sign(user);
  }
}
