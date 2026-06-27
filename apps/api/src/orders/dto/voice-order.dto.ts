import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class VoiceOrderDto {
  @ApiPropertyOptional({ example: 'user-001' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'dat xe tu nha den san bay Tan Son Nhat' })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional({ description: 'Base64 audio' })
  @IsOptional()
  @IsString()
  audioBase64?: string;

  @ApiPropertyOptional({
    example: 10.8494,
    description: 'Vĩ độ hiện tại của người dùng',
  })
  @IsOptional()
  @IsNumber()
  currentLat?: number;

  @ApiPropertyOptional({
    example: 106.7537,
    description: 'Kinh độ hiện tại của người dùng',
  })
  @IsOptional()
  @IsNumber()
  currentLng?: number;

  @ApiPropertyOptional({
    description:
      'Bat accessibility mode — driver/restaurant nhan thong bao ho tro dac biet',
  })
  @IsOptional()
  @IsBoolean()
  accessibilityFlag?: boolean;
}
