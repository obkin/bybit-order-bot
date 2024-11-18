import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  symbol: string; // example: "BTCUSDT"

  @IsNumber()
  price: number;

  @IsNumber()
  qty: number; // кількість контрактів

  @IsNumber()
  leverage: number;

  @IsOptional()
  @IsNumber()
  takeProfit?: number; // тейкпрофіт (optional)
}
