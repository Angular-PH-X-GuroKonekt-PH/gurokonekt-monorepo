import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';

@Injectable()
export class AvatarInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const filesInterceptor = new (FilesInterceptor('avatar', 1, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new Error('Only PNG, JPEG, and JPG files are allowed'),
            false,
          );
        }

        cb(null, true);
      },
    }))();

    return filesInterceptor.intercept(context, next);
  }
}
