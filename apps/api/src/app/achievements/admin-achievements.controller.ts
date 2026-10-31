import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateAchievementDto,
  ListAchievementSubmissionsQueryDto,
  ReviewAchievementDto,
  UpdateAchievementDto,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AchievementsService, Actor } from './achievements.service';
import { unwrap } from './achievements.controller';

type AuthedRequest = { user: { id: string } };

const actorOf = (req: AuthedRequest, ipAddress: string, userAgent: string): Actor => ({
  id: req.user.id,
  ipAddress,
  userAgent,
});

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/achievements')
export class AdminAchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  // ---------------- Review queue (static paths before ':id') ----------------

  @Get('submissions')
  @ApiOperation({ summary: 'Mentor applications and badges, optionally filtered by status' })
  async listSubmissions(@Query() query: ListAchievementSubmissionsQueryDto) {
    return unwrap(await this.achievements.listSubmissions(query.status));
  }

  @Get('submissions/:submissionId/proof')
  @ApiOperation({ summary: 'Short-lived link to view the proof file (expires in 10 minutes)' })
  async getProof(@Param('submissionId') submissionId: string) {
    return unwrap(await this.achievements.getProofUrl(submissionId));
  }

  @Patch('submissions/:submissionId/approve')
  @ApiOperation({ summary: 'Approve a pending application' })
  async approve(
    @Param('submissionId') submissionId: string,
    @Request() req: AuthedRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return unwrap(await this.achievements.approve(submissionId, actorOf(req, ip, ua)));
  }

  @Patch('submissions/:submissionId/reject')
  @ApiOperation({ summary: 'Reject a pending application with a reason' })
  async reject(
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewAchievementDto,
    @Request() req: AuthedRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return unwrap(await this.achievements.reject(submissionId, dto, actorOf(req, ip, ua)));
  }

  @Patch('submissions/:submissionId/revoke')
  @ApiOperation({ summary: 'Take away a granted badge with a reason' })
  async revoke(
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewAchievementDto,
    @Request() req: AuthedRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return unwrap(await this.achievements.revoke(submissionId, dto, actorOf(req, ip, ua)));
  }

  // ---------------- Catalog ----------------

  @Get()
  @ApiOperation({ summary: 'All achievements with holder and pending counts' })
  async list() {
    return unwrap(await this.achievements.listAchievements());
  }

  @Post()
  @ApiOperation({ summary: 'Create an achievement (automatic ones are granted right away to mentors who qualify)' })
  async create(
    @Body() dto: CreateAchievementDto,
    @Request() req: AuthedRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return unwrap(await this.achievements.createAchievement(dto, actorOf(req, ip, ua)));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an achievement' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAchievementDto,
    @Request() req: AuthedRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return unwrap(await this.achievements.updateAchievement(id, dto, actorOf(req, ip, ua)));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an achievement nobody has applied for or earned' })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return unwrap(await this.achievements.deleteAchievement(id, actorOf(req, ip, ua)));
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Check an automatic achievement now and grant it to mentors who qualify' })
  async evaluate(@Param('id') id: string) {
    return unwrap(await this.achievements.evaluateNow(id));
  }
}
