import { ApiProperty } from '@nestjs/swagger';
import { ResponseInterface, ResponseStatus } from '@gurokonekt/models';


export class ResponseDto<T = unknown> implements ResponseInterface<T> {
  @ApiProperty({
    description: 'The status of the response',
    enum: ResponseStatus,
    example: ResponseStatus.Success,
  })
  status!: ResponseStatus;

  @ApiProperty({
    description: 'The status code of the response',
    example: 200,
  })
  statusCode!: number;

 @ApiProperty({
    nullable: true,
    description: 'Human-readable message'
  })
  message!: string;

  @ApiProperty({
    nullable: true,
    description: 'Payload returned by the request',
    type: Object
  })
  data!: T | null;
}