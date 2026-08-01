import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActiverCompteDto } from './dto/activer-compte.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('activer')
  @HttpCode(HttpStatus.OK)
  activer(@Body() dto: ActiverCompteDto) {
    return this.authService.activerCompte(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('mot-de-passe-oublie')
  @HttpCode(HttpStatus.OK)
  motDePasseOublie(@Body('emailPersonnel') emailPersonnel: string, @Req() req: Request) {
    const urlBase = `${req.protocol}://${req.get('host')}`;
    return this.authService.demanderReinitialisation(emailPersonnel, urlBase);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reinitialiser-mot-de-passe')
  @HttpCode(HttpStatus.OK)
  reinitialiserMotDePasse(
    @Body('token') token: string,
    @Body('nouveauMotDePasse') nouveauMotDePasse: string,
  ) {
    return this.authService.reinitialiserAvecToken(token, nouveauMotDePasse);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: JwtPayload) {
    return this.authService.changePassword(user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('email-personnel')
  updateEmailPersonnel(
    @Body('emailPersonnel') emailPersonnel: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.updateEmailPersonnel(user.sub, emailPersonnel);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('informations-personnelles')
  updateInformationsPersonnelles(
    @Body('dateNaissance') dateNaissance: string,
    @Body('telephone') telephone: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.updateInformationsPersonnelles(user.sub, dateNaissance, telephone);
  }
}
