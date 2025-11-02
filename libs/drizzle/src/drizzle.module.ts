import { Module } from '@nestjs/common';
import { DrizzleService } from './drizzle.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
