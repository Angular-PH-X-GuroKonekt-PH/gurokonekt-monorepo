import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AwardBadgeDto, ListBadgesQueryDto, UpdateBadgeDto } from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { BadgesService } from './badges.service';
import { unwrap } from './badges.controller';

type AuthedRequest = { user: { id: string } };

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/badges')
export class AdminBadgesController {
  constructor(private readonly badges: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'All badge definitions with how many users unlocked each (filter with ?category=SPECIAL)' })
  async list(@Query() query: ListBadgesQueryDto) {
    return unwrap(await this.badges.listBadges(query.category));
  }

  // Static path before ':badgeId'.
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed missing badges and re-evaluate every user against their historical activity' })
  async evaluate() {
    return unwrap(await this.badges.runBackfill());
  }

  @Patch(':badgeId')
  @ApiOperation({ summary: 'Change name, description, category, rarity, requirement or enable/disable a badge' })
  async update(
    @Param('badgeId') badgeId: string,
    @Body() dto: UpdateBadgeDto,
    @Request() req: AuthedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return unwrap(await this.badges.updateBadge(badgeId, dto, { id: req.user.id, ipAddress, userAgent }));
  }

  @Post(':badgeId/award')
  @ApiOperation({ summary: 'Award a special badge to a user (once per user; audited)' })
  async award(
    @Param('badgeId') badgeId: string,
    @Body() dto: AwardBadgeDto,
    @Request() req: AuthedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return unwrap(await this.badges.awardSpecialBadge(badgeId, dto, { id: req.user.id, ipAddress, userAgent }));
  }
}
