import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Param,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AchievementProofInterceptor,
  ApplyAchievementDto,
  ResponseDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AchievementsService } from './achievements.service';

type AuthedRequest = { user: { id: string } };

/** Mentor-facing achievement endpoints. Always act on the signed-in mentor. */
@ApiTags('achievements')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: "Active achievements with the signed-in mentor's status and progress" })
  async getCatalog(@Request() req: AuthedRequest) {
    return unwrap(await this.achievements.getMentorCatalog(req.user.id));
  }

  @Put(':achievementId/application')
  @UseInterceptors(AchievementProofInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Apply for an achievement, or update an existing application',
    description:
      'Multipart form: `details`, `earnedAt`, `expiresAt` (ISO dates, optional), `proof` (file, PDF/PNG/JPEG/WebP up to 10 MB) and `keepProof` (true to keep the file already on record). ' +
      'Updating an approved badge sends it back for review unless the achievement auto-approves.',
  })
  async submit(
    @Param('achievementId') achievementId: string,
    @Body() dto: ApplyAchievementDto,
    @UploadedFile() proof: Express.Multer.File | undefined,
    @Request() req: AuthedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return unwrap(
      await this.achievements.submitApplication(req.user.id, achievementId, dto, proof, {
        id: req.user.id,
        ipAddress,
        userAgent,
      }),
    );
  }

  @Delete(':achievementId/application')
  @ApiOperation({ summary: 'Withdraw an application or remove a badge you applied for' })
  async withdraw(
    @Param('achievementId') achievementId: string,
    @Request() req: AuthedRequest,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return unwrap(
      await this.achievements.withdrawApplication(req.user.id, achievementId, { id: req.user.id, ipAddress, userAgent }),
    );
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
