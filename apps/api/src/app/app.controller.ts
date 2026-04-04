import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API version and status' })
  @ApiResponse({
    status: 200,
    description: 'API version and status',
    schema: {
      example: {
        version: '1.3.0',
        message: 'Gurokonekt API v1.3.0',
      },
    },
  })
  getData() {
    return this.appService.getVersion();
  }
}
