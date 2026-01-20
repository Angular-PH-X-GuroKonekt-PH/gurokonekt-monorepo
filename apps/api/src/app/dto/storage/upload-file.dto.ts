import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload (as File object)',
  })
  file: File;

  @ApiProperty({
    description: 'User ID associated with the file',
    type: String,
  })
  userId: string;
}
