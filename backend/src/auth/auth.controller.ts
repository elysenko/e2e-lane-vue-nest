import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/auth.dto';

/**
 * Public user auth. `full_auth` baseline: signup (first user becomes admin),
 * login and a stateless logout. None of these guard the public bookmark routes.
 */
@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  signup(@Body() dto: SignupDto): Promise<{ token: string; role: string }> {
    return this.authService.signup(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ token: string; role: string }> {
    return this.authService.login(dto.email, dto.password);
  }

  /** Stateless JWT logout: nothing to invalidate server-side. */
  @Post('logout')
  @HttpCode(200)
  logout(): { ok: true } {
    return { ok: true };
  }
}
