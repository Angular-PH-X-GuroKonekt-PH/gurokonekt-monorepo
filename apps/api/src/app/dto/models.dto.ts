import { ApiProperty } from '@nestjs/swagger';
import { AsyncStatus } from '@gurokonekt/models';

export class AsyncReturnDto<T = unknown> {
  @ApiProperty({ enum: AsyncStatus })
  status: AsyncStatus;

  @ApiProperty({ nullable: true })
  message: string | null;

  @ApiProperty({ nullable: true, type: Object })
  data: T | null;
}
