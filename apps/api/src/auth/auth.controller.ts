import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto.email.trim().toLowerCase(), loginDto.password);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post('logout')
  async logout() {
    // Logout is handled client-side (remove token from localStorage)
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    if (!authorization) return null;
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.authService.me(token);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Headers('authorization') authorization: string,
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return this.authService.updatePassword(payload.sub, body.oldPassword, body.newPassword);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
