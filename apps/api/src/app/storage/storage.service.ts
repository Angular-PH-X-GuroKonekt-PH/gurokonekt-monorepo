import { ResponseDto, SelectFields } from '@gurokonekt/be-models';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { API_RESPONSE, BUCKET_NAMES, DOCUMENTS_ALLOWED_TYPES, IMAGES_ALLOWED_TYPES, ResponseStatus, UserRole } from '@gurokonekt/models';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private selectFields = new SelectFields();
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
          select: this.selectFields.getAvatarAttachmentSelect()
        });

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

  async uploadDocument(files: Express.Multer.File[], userId: string, role: string): Promise<ResponseDto> {
    try {
      const response: ResponseDto[] = [];
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
          .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
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
            .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
            .getPublicUrl(filePath);

        const document = await this.prisma.db.documentAttachment.create({
          data: {
            userId: userId,
            bucketName: BUCKET_NAMES.MENTOR_DOCUMENTS,
            storagePath: filePath,
            publicUrl: publicUrl.publicUrl,
            fileType: file.mimetype,
            fileSize: file.size,
            fileName: file.originalname,
          },
          select: this.selectFields.getDocumentAttachmentSelect()
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
