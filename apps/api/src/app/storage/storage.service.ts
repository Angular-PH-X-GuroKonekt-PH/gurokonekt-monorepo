import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { API_RESPONSE, BUCKET_NAMES, DOCUMENTS_ALLOWED_TYPES, IMAGES_ALLOWED_TYPES, 
  ResponseStatus, UserRole, ResponseDto, SelectFields 
} from '@gurokonekt/models';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async uploadAvatar(files: Express.Multer.File[], userId: string, role: string): Promise<ResponseDto> {
    try {
      const response: ResponseDto[] = [];
      for (const file of files) {
        if (!IMAGES_ALLOWED_TYPES.includes(file.mimetype)) {
          this.logger.error(
            `Unsupported file type: ${file.originalname} (${file.mimetype})`
          );
          response.push({
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.UNSUPPORTED_FILE_TYPE.code,
            message: API_RESPONSE.ERROR.UNSUPPORTED_FILE_TYPE.message,
            data: `File ${file.originalname} is not an image (${file.mimetype})`
          });
          continue;
        }
        
        const fileExt = file.originalname.split('.').pop();
        const filePath = `${role}/${userId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await this.supabase.clientAdmin.storage
          .from(BUCKET_NAMES.AVATARS)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          this.logger.error(uploadError.message, uploadError.stack);
          response.push({
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
            message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
            data: uploadError
          });
          continue;
        }
        
        const { data: publicUrl } = this.supabase.client.storage
            .from(BUCKET_NAMES.AVATARS)
            .getPublicUrl(filePath);

        const avatar = await this.prisma.db.avatarAttachment.create({
          data: {
            userId: userId,
            bucketName: BUCKET_NAMES.AVATARS,
            storagePath: filePath,
            publicUrl: publicUrl.publicUrl,
            fileType: file.mimetype,
            fileSize: file.size,
            fileName: file.originalname,
          },
          select: SelectFields.getAvatarAttachmentSelect()
        });

        await this.replacePreviousAvatars(userId, avatar.id);

        response.push({
          status: ResponseStatus.Success,
          statusCode: API_RESPONSE.SUCCESS.UPLOAD_FILES.code,
          message: API_RESPONSE.SUCCESS.UPLOAD_FILES.message,
          data: avatar,
        });
      }
      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPLOAD_FILES.code,
        message: API_RESPONSE.SUCCESS.UPLOAD_FILES.message,
        data: response,
      }
    } catch (error) {
      this.logger.error(API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR);
      return { 
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error
      }
    }
  }

  /**
   * Keep a single current avatar: remove older attachment rows and storage objects.
   */
  private async replacePreviousAvatars(userId: string, keepAvatarId: string): Promise<void> {
    const previousAvatars = await this.prisma.db.avatarAttachment.findMany({
      where: {
        userId,
        NOT: { id: keepAvatarId },
      },
      select: {
        id: true,
        bucketName: true,
        storagePath: true,
      },
    });

    if (previousAvatars.length === 0) {
      return;
    }

    const pathsByBucket = previousAvatars.reduce<Record<string, string[]>>((acc, avatar) => {
      if (!acc[avatar.bucketName]) {
        acc[avatar.bucketName] = [];
      }
      acc[avatar.bucketName].push(avatar.storagePath);
      return acc;
    }, {});

    for (const [bucketName, paths] of Object.entries(pathsByBucket)) {
      const { error } = await this.supabase.clientAdmin.storage.from(bucketName).remove(paths);
      if (error) {
        this.logger.warn(`Failed to remove previous avatar files from ${bucketName}: ${error.message}`);
      }
    }

    await this.prisma.db.avatarAttachment.deleteMany({
      where: {
        userId,
        NOT: { id: keepAvatarId },
      },
    });
  }

  async uploadDocument(files: Express.Multer.File[], userId: string, role: string): Promise<ResponseDto> {
    try {
      const response: ResponseDto[] = [];
      const bucket = role === UserRole.Mentee ? BUCKET_NAMES.MENTEE_DOCUMENTS : BUCKET_NAMES.MENTOR_DOCUMENTS;
      for (const file of files) {
        if (!DOCUMENTS_ALLOWED_TYPES.includes(file.mimetype)) {
          this.logger.error(
            `Unsupported file type: ${file.originalname} (${file.mimetype})`
          );
          response.push({
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.UNSUPPORTED_FILE_TYPE.code,
            message: API_RESPONSE.ERROR.UNSUPPORTED_FILE_TYPE.message,
            data: `File ${file.originalname} is not supported document (${file.mimetype})`
          });
          continue;
        }
        
        const fileExt = file.originalname.split('.').pop();
        const filePath = `${role}/${userId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await this.supabase.clientAdmin.storage
          .from(bucket)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          this.logger.error(uploadError.message, uploadError.stack);
          response.push({
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
            message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
            data: uploadError
          });
          continue;
        }
        
        const { data: publicUrl } = this.supabase.client.storage
            .from(bucket)
            .getPublicUrl(filePath);

        const document = await this.prisma.db.documentAttachment.create({
          data: {
            userId: userId,
            bucketName: bucket,
            storagePath: filePath,
            publicUrl: publicUrl.publicUrl,
            fileType: file.mimetype,
            fileSize: file.size,
            fileName: file.originalname,
          },
          select: SelectFields.getDocumentAttachmentSelect()
        });

        response.push({
          status: ResponseStatus.Success,
          statusCode: API_RESPONSE.SUCCESS.UPLOAD_FILES.code,
          message: API_RESPONSE.SUCCESS.UPLOAD_FILES.message,
          data: document,
        });
      }
      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPLOAD_FILES.code,
        message: API_RESPONSE.SUCCESS.UPLOAD_FILES.message,
        data: response,
      }
    } catch (error) {
      this.logger.error(API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR);
      return { 
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: error
      }
    }
  }
}
