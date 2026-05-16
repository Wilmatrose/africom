import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Req 
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, SignupDto, LoginDto } from './auth.service';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

 @Post('signup')
async signup(@Body() body: SignupDto, @Req() req: Request) {
  console.log('CONTROLLER: Signup request received for', body.username);
  try {
    const result = await this.authService.signup(body, req.ip);
    console.log('CONTROLLER: Signup successful');
    return result;
  } catch (error) {
    console.error('CONTROLLER: Signup failed', error);
    throw error; // Re-throw so Nest sends the proper error code
  }
}

  @Post('login')
  // Add @Req() req to access the request object
  async login(@Body() body: LoginDto, @Req() req: Request) {
    console.log('CONTROLLER: Login request received for', body.username);
    // Pass req.ip as the second argument
    return this.authService.login(body, req.ip);
  }

  // ==================================================
  // TEMPORARY DEBUG ROUTE
  // ==================================================
  @Get('fix-password')
  async fixPassword() {
    const plainPassword = 'admin123';
    const hash = await bcrypt.hash(plainPassword, 10);

    console.log('============================================');
    console.log('COPY THIS SQL COMMAND TO PGADMIN:');
    console.log(`UPDATE "users" SET "password_hash" = '${hash}' WHERE "username" = 'mayor';`);
    console.log('============================================');

    return {
      message: 'Check your Backend Terminal for the SQL update command',
      hash_preview: hash.substring(0, 20) + '...'
    };
  }
}