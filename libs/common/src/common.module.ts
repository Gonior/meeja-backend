import { Global, Module } from '@nestjs/common';

import { ConfigModule } from './configs/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [],
  exports: [ConfigModule],
})
export class CommonModule {}
