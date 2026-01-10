import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('test')
export class TestController {
  @UseGuards(JwtAccessGuard)
  @Get('protected')
  test(@Req() req) {
    return {
      message: 'Access granted',
      user: req.user,
    };
  }
}
