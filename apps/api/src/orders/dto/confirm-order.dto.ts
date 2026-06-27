import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { PartnerCode } from '../../types';

export class ConfirmOrderDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  orderId!: string;

  @ApiProperty({ enum: PartnerCode, example: PartnerCode.GRAB })
  @IsEnum(PartnerCode)
  partner!: PartnerCode;
}
