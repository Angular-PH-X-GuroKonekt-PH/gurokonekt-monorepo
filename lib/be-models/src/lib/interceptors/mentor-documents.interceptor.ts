import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';

@Injectable()
export class MentorDocumentsInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const filesInterceptor = new (FilesInterceptor('files', 5, {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new Error('Only PDF, PNG, and JPEG files are allowed'),
            false,
          );
        }

        cb(null, true);
      },
    }))();

    return filesInterceptor.intercept(context, next);
  }
}
