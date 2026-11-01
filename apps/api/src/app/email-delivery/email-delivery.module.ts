import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailDeliveryService } from './email-delivery.service';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [EmailDeliveryService],
  exports: [EmailDeliveryService],
})
export class EmailDeliveryModule {}
