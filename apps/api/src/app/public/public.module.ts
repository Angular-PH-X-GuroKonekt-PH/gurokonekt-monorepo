import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecaptchaModule } from '../recaptcha/recaptcha.module';
import { PublicMentorController } from './public-mentor.controller';
import { PublicMentorService } from './public-mentor.service';
import { PublicInquiryController } from './public-inquiry.controller';
import { PublicInquiryService } from './public-inquiry.service';

/**
 * Unauthenticated endpoints for the public marketing site.
 *
 * Kept separate from `SearchModule` so the absence of guards is explicit rather
 * than an exception hidden among guarded routes.
 */
@Module({
  imports: [PrismaModule, RecaptchaModule],
  controllers: [PublicMentorController, PublicInquiryController],
  providers: [PublicMentorService, PublicInquiryService],
})
export class PublicModule {}
