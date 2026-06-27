import { Controller, Get } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Rule Engine')
@Controller('engine')
export class EngineController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
  ) {}

  @Get('rules')
  getRules() {
    return this.proxyService.forward(
      `${this.config.get('RULE_ENGINE_URL')}/engine/rules`,
      'GET',
    );
  }
}
