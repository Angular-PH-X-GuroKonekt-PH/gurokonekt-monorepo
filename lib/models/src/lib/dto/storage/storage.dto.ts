import { UploadFilesInterface, DeleteFilesInterface } from "@gurokonekt/models";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray } from 'class-validator';

export class UploadFilesDto implements UploadFilesInterface {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
    description: 'Supporting documents (PDF, images, etc.)',
  })
  files!: any[];

  @ApiProperty({
    example: '123-asd-2s2',
    description: 'User ID',
  })
  @IsString()
  userId!: string;
}

export class DeleteFilesDto implements DeleteFilesInterface {
  @ApiProperty({
    type: 'string',
    isArray: true,
    description: 'Storage paths of files to be deleted',
  })
  @IsArray()
  storagePaths!: string[];
}