import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import {
  ACHIEVEMENT_PROOF_MAX_BYTES,
  ACHIEVEMENT_PROOF_TYPES,
} from '../../interfaces/achievement/achievement.model';

/** Single optional `proof` file for an achievement application. */
@Injectable()
export class AchievementProofInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const fileInterceptor = new (FileInterceptor('proof', {
      limits: { fileSize: ACHIEVEMENT_PROOF_MAX_BYTES },
      fileFilter: (req, file, cb) => {
        if (!ACHIEVEMENT_PROOF_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('Only PDF, PNG, JPEG and WebP files are allowed'), false);
        }
        cb(null, true);
      },
    }))();

    return fileInterceptor.intercept(context, next);
  }
}
