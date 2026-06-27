import { Body, Controller, Post } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PartnerCode } from '../types';

class StartDto {
  @IsOptional() @IsString() userId?: string;
}

class InputDto {
  @IsString() sessionId!: string;
  @IsString() transcript!: string;
  @IsOptional() @IsString() userId?: string;
}

class ConfirmDto {
  @IsString() sessionId!: string;
  @IsEnum(PartnerCode) partner!: PartnerCode;
}

@Controller('conversation')
export class ConversationController {
  constructor(private readonly svc: ConversationService) {}

  @Post('start')
  start(@Body() dto: StartDto) {
    return this.svc.start(dto.userId);
  }

  @Post('input')
  input(@Body() dto: InputDto) {
    return this.svc.input({
      sessionId: dto.sessionId,
      transcript: dto.transcript,
      userId: dto.userId,
    });
  }

  @Post('confirm')
  confirm(@Body() dto: ConfirmDto) {
    return this.svc.confirm({ sessionId: dto.sessionId, partner: dto.partner });
  }
}
