import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { Quote } from './entities/quote.entity';
import { RedisService } from '../redis/redis.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quote]), HttpModule, AiModule],
  controllers: [QuotesController],
  providers: [QuotesService, RedisService],
})
export class QuotesModule {}
