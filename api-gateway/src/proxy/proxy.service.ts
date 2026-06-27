import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) {}

  async forward(url: string, method: string, body?: any, headers?: any) {
    try {
      const config: any = {
        method,
        url,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) config.data = body;
      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Service unavailable',
        error.response?.status || 503,
      );
    }
  }
}
