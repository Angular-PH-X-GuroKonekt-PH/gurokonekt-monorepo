import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { AsyncReturn, AsyncStatus } from '@gurokonekt/models';
import { DeleteFileDto, UploadFileDto } from '../../dto/storage';


@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload avatar
   */
  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Unsupported file type or missing parameters' })
  @HttpCode(HttpStatus.OK)
  async uploadAvatar(@Body() body: UploadFileDto): Promise<AsyncReturn> {
    const { file, userId } = body;

    if (!file || !userId) {
      return {
        status: AsyncStatus.Error,
        message: 'File and userId are required',
        data: null,
      };
    }

    return this.uploadService.uploadAvatar(file, userId);
  }

  /**
   * Upload document
   */
  @Post('document')
  @ApiOperation({ summary: 'Upload user document' })
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Unsupported file type or missing parameters' })
  @HttpCode(HttpStatus.OK)
  async uploadDocument(@Body() body: UploadFileDto): Promise<AsyncReturn> {
    const { file, userId } = body;

    if (!file || !userId) {
      return {
        status: AsyncStatus.Error,
        message: 'File and userId are required',
        data: null,
      };
    }

    return this.uploadService.uploadDocument(file, userId);
  }

  /**
   * Delete avatars
   */
  @Post('delete-avatar')
  @ApiOperation({ summary: 'Delete avatar files' })
  @ApiResponse({ status: 200, description: 'Avatar(s) deleted successfully' })
  @ApiResponse({ status: 400, description: 'No storage paths provided' })
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Body() body: DeleteFileDto): Promise<AsyncReturn> {
    if (!body.storagePaths || body.storagePaths.length === 0) {
      return {
        status: AsyncStatus.Error,
        message: 'storagePaths are required',
        data: null,
      };
    }

    return this.uploadService.deleteAvatar(body.storagePaths);
  }

  /**
   * Delete documents
   */
  @Post('delete-document')
  @ApiOperation({ summary: 'Delete document files' })
  @ApiResponse({ status: 200, description: 'Document(s) deleted successfully' })
  @ApiResponse({ status: 400, description: 'No storage paths provided' })
  @HttpCode(HttpStatus.OK)
  async deleteDocument(@Body() body: DeleteFileDto): Promise<AsyncReturn> {
    if (!body.storagePaths || body.storagePaths.length === 0) {
      return {
        status: AsyncStatus.Error,
        message: 'storagePaths are required',
        data: null,
      };
    }

    return this.uploadService.deleteDocument(body.storagePaths);
  }
}