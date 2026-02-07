import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    // blah blah blah
    return { message: 'Hello API Release' };
  }
}
