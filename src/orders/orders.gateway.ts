import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway()
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(OrdersGateway.name);
  private ws: WebSocket;

  constructor(private configService: ConfigService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
    this.connectToBybit();
  }

  handleConnection() {
    this.logger.log('Client connected to WebSocket');
  }

  handleDisconnect() {
    this.logger.log('Client disconnected from WebSocket');
    if (this.ws) {
      this.ws.close();
    }
    setTimeout(() => this.connectToBybit(), 5000);
  }

  private connectToBybit() {
    const url = 'wss://stream-testnet.bybit.com/v5/trade'; // correct url??
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.logger.log('Connected to Bybit WebSocket');
      this.authenticate();
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.topic === 'execution' && message.data?.status === 'Filled') {
        this.logger.log(`Order completed - id: ${message.data.orderId}`);
      }
    });

    this.ws.on('error', (err) => {
      this.logger.error('WebSocket error:', err.message);
    });
  }

  private authenticate() {
    const apiKey = this.configService.get<string>('BYBIT_API_KEY');
    const apiSecret = this.configService.get<string>('BYBIT_API_SECRET');
    const expires = Date.now() + 60 * 1000;
    const apiTimestamp = Math.floor(expires / 1000).toString();

    if (!apiKey) {
      this.logger.error('BYBIT_API_KEY not found');
      return;
    }
    if (!apiSecret) {
      this.logger.error('BYBIT_API_SECRET not found');
      return;
    }

    const signatureString = `api_key=${apiKey}&api_timestamp=${apiTimestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureString)
      .digest('hex');

    const authMessage = {
      op: 'auth',
      args: [apiKey, apiTimestamp, signature],
    };

    this.ws.send(JSON.stringify(authMessage));
    this.logger.log('Authentication message sent');
  }
}
