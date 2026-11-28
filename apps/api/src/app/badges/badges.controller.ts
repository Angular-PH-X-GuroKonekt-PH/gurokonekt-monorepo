import { Body, Controller, Get, HttpException, HttpStatus, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseDto, ResponseStatus, SetFeaturedBadgesDto } from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { BadgesService } from './badges.service';

type AuthedRequest = { user: { id: string } };

/** The signed-in user's achievements. Mentors and mentees alike. */
@ApiTags('badges')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('badges')
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  @Get('me')
  @ApiOperation({
    summary: 'My achievements: unlocked badges with their date, locked badges with progress, and featured badges',
  })
  async getMine(@Request() req: AuthedRequest) {
    return unwrap(await this.badges.getUserAchievements(req.user.id));
  }

  @Put('me/featured')
  @ApiOperation({
    summary: 'Set featured badges (max 3, unlocked only). Replaces the current selection; [] clears it',
  })
  async setFeatured(@Body() dto: SetFeaturedBadgesDto, @Request() req: AuthedRequest) {
    return unwrap(await this.badges.setFeatured(req.user.id, dto));
  }
}

export function unwrap(response: ResponseDto): ResponseDto {
  if (response.status === ResponseStatus.Error) {
    throw new HttpException(
      { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
      response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return response;
}
