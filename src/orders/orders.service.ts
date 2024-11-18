import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import axios from 'axios';

@Injectable()
export class OrdersService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('BYBIT_API_URL');
    this.apiKey = this.configService.get<string>('BYBIT_API_KEY');
    this.apiSecret = this.configService.get<string>('BYBIT_API_SECRET');
  }

  async createOrder(dto: CreateOrderDto) {
    try {
      const { symbol, price, qty, leverage, takeProfit } = dto;

      const orderData = {
        symbol,
        price,
        qty,
        orderType: 'Limit',
        side: 'Buy', // Лонг
        timeInForce: 'GoodTillCancel',
        reduceOnly: false,
        leverage,
        takeProfit,
      };

      const response = await axios.post(
        `${this.apiUrl}/v5/order/create`,
        orderData,
        {
          headers: {
            'X-BYBIT-API-KEY': this.apiKey,
          },
        },
      );

      return response.data;
    } catch (e) {
      throw new HttpException(
        e.response?.data || 'Failed to create order',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
