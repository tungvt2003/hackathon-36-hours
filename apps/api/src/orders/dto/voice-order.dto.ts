import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VoiceOrderDto {
  @ApiPropertyOptional({ example: 'user-001' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'đặt xe từ nhà đến sân bay Tân Sơn Nhất' })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional({ description: 'Base64 audio - team voice implement sau' })
  @IsOptional()
  @IsString()
  audioBase64?: string;
}
