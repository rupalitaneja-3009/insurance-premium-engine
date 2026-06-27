import { Module, MiddlewareConsumer } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { PlansController } from './plans.controller';
import { QuotesController } from './quotes.controller';
import { EngineController } from './engine.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [PlansController, QuotesController, EngineController],
  providers: [ProxyService],
})
export class ProxyModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
