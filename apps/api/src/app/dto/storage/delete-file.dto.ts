import { ApiProperty } from '@nestjs/swagger';

export class DeleteFileDto {
  @ApiProperty({
    description: 'List of file storage paths to delete from Supabase',
    type: [String],
    example: ['avatars/user-id/avatar.png', 'documents/user-id/doc.pdf'],
  })
  storagePaths: string[];
}