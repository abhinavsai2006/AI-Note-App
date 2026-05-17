import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly PASSWORD_MIN_LENGTH = 8;

  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  validatePassword(password: string): string[] {
    const errors: string[] = [];
    
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters`);
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain special characters (@$!%*?&)');
    }
    
    return errors;
  }

  async create(createAuthDto: CreateAuthDto) {
    const email = createAuthDto.email.trim().toLowerCase();
    
    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    const passwordErrors = this.validatePassword(createAuthDto.password);
    if (passwordErrors.length > 0) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: passwordErrors,
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    // Hash password with salt rounds
    const passwordHash = await bcrypt.hash(createAuthDto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: createAuthDto.name.trim(),
        email,
        passwordHash,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);
    
    return { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        avatarUrl: user.avatarUrl 
      }, 
      accessToken,
      refreshToken,
    };
  }

  private generateTokens(user: { id: string; email: string; name: string }) {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      { expiresIn: '7d' }
    );

    const refreshToken = this.jwt.sign(
      { sub: user.id },
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) return null;
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email.toLowerCase(), password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const { accessToken, refreshToken } = this.generateTokens(user);
    
    return { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        avatarUrl: user.avatarUrl 
      }, 
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      
      const accessToken = this.jwt.sign(
        { sub: user.id, email: user.email, name: user.name },
        { expiresIn: '7d' }
      );
      
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(token: string) {
    try {
      const payload = this.jwt.verify(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException();

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    // Validate new password
    const passwordErrors = this.validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      throw new BadRequestException({
        message: 'New password does not meet security requirements',
        errors: passwordErrors,
      });
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password updated successfully' };
  }

  // Placeholder CRUDs
  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
