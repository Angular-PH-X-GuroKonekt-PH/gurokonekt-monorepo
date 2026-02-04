import { Injectable } from '@nestjs/common';
import { BUCKET_NAMES, DOCUMENTS_ALLOWED_TYPES, IMAGES_ALLOWED_TYPES, RETURN_MESSAGES } from '@gurokonekt/models/constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AsyncReturn, AsyncStatus } from '@gurokonekt/models';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(RETURN_MESSAGES.FAILURE.SUPABASE_CREDENTIALS_NOT_FOUND);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * @description - Upload avatars
   * @param file - File to upload
   * @param userId - User ID
   * @returns - public url, storage path, file type, file size, file name
  */
   async uploadAvatar(
    file: File, 
    userId: string
  ): Promise<AsyncReturn> {
    try {
      if (!IMAGES_ALLOWED_TYPES.includes(file.type)) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNSUPPORTED_FILE_TYPE,
          data: null
        }
      }

      const path = `avatars/${userId}/${file.name}`;

      const { error } = await this.supabase.storage
        .from(BUCKET_NAMES.AVATARS)
        .upload(path, file);

      if (error) {
        return {
          status: AsyncStatus.Error,
          message: error.message,
          data: null
        }
      }

      const { data } = this.supabase.storage
        .from(BUCKET_NAMES.AVATARS)
        .getPublicUrl(path);
      
      const publicUrl = data?.publicUrl || null;
      if (!publicUrl) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.FILE_URL_NOT_FOUND,
          data: null
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.FILE_UPLOAD_SUCCESS,
        data: {
          publicUrl: publicUrl,
          storagePath: path,
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
        }
      };
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: error.message,
        data: null
      }
    }
  }

  /**
   * @description - Upload documents
   * @param file - File to upload
   * @param userId - User ID
   * @returns - public url, storage path, file type, file size, file name
  */
  async uploadDocument(
    file: File,
    userId: string
  ): Promise<AsyncReturn> {
    try {
      if (!DOCUMENTS_ALLOWED_TYPES.includes(file.type)) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNSUPPORTED_FILE_TYPE,
          data: null
        }
      }

      const path = `documents/${userId}/${file.name}`;

      const { error } = await this.supabase.storage
        .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
        .upload(path, file);

      if (error) {
        return {
          status: AsyncStatus.Error,
          message: error.message,
          data: null
        }
      }

      const { data } = this.supabase.storage
        .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
        .getPublicUrl(path);
      
      const publicUrl = data?.publicUrl || null;
      if (!publicUrl) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.FILE_URL_NOT_FOUND,
          data: null
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.FILE_UPLOAD_SUCCESS,
        data: {
          publicUrl: publicUrl,
          storagePath: path,
          fileType: file.type,
          fileSize: file.size,
          fileName: file.name,
        }
      };
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: error.message,
        data: null
      }
    }
  }

  /**
   * @description - Delete file
   * @param storagePath - List of storage path string
   * @returns - deleted status and storage path
  */
  async deleteFile(storagePath: string[]): Promise<AsyncReturn> {
    try {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAMES.MENTOR_DOCUMENTS)
        .remove(storagePath);

      if (error) {
        return {
          status: AsyncStatus.Error,
          message: error.message,
          data: null
        }
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.FILE_DELETE_SUCCESS,
        data: { 
          deleted: true, 
          path: storagePath 
        }
      };
    } catch (error) {
      console.error(error);
      return {
        status: AsyncStatus.Error,
        message: error.message,
        data: null
      }
    }
  }

  /**
   * @description - Delete avatar
   * @param storagePaths - List of storage path string
   * @returns - deleted status and storage path
  */
  async deleteAvatar(storagePaths: string[]): Promise<AsyncReturn> {
    const allAvatar = storagePaths.every((p) => p.startsWith('avatars/'));

    if (!allAvatar) {
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.START_WITH_AVATAR,
        data: null,
      };
    }

    return this.deleteFile(storagePaths);
  }

  /**
   * @description - Delete documents
   * @param storagePath - Storage path
   * @returns - 
  */
  async deleteDocument(storagePaths: string[]): Promise<AsyncReturn> {
    const allDocument = storagePaths.every((p) => p.startsWith('documents/'));

    if (!allDocument) {
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.START_WITH_DOCUMENTS,
        data: null,
      };
    }

    return this.deleteFile(storagePaths);
  }
}
