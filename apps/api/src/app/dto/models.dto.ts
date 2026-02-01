import { ApiProperty } from '@nestjs/swagger';
import { AsyncStatus } from '@gurokonekt/models';

export class AsyncReturnDto<T = unknown> {
  @ApiProperty({
    description: 'Application-level status of the request',
    enum: AsyncStatus
  })
  status: AsyncStatus;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 200
  })
  statusCode: number;

  @ApiProperty({
    nullable: true,
    description: 'Human-readable message'
  })
  message: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Payload returned by the request',
    type: Object
  })
  data: T | null;
}
