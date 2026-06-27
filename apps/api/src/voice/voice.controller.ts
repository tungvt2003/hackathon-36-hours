import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { VoiceService } from './voice.service';

class VoiceStartDto {
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() user_id?: string;
}

class VoiceTurnDto {
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsString() session_id?: string;
  @IsOptional() @IsString() transcript?: string;
  @IsOptional() @IsString() audioBase64?: string;
  @IsOptional() @IsString() audio_base64?: string;
  @IsOptional() @IsNumber() sampleRate?: number;
  @IsOptional() @IsNumber() sample_rate?: number;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() user_id?: string;
  @IsOptional() @IsNumber() currentLat?: number;
  @IsOptional() @IsNumber() currentLng?: number;
  @IsOptional() @IsBoolean() accessibilityFlag?: boolean;
}

@Controller()
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post('voice/start')
  start(@Body() dto: VoiceStartDto) {
    return this.voice.start(dto.user_id ?? dto.userId);
  }

  @Post('session')
  startAlias(@Body() dto: VoiceStartDto) {
    return this.start(dto);
  }

  @Post('voice/turn')
  turn(@Body() dto: VoiceTurnDto) {
    return this.voice.turn({
      session_id: dto.session_id ?? dto.sessionId,
      transcript: dto.transcript,
      audio_base64: dto.audio_base64 ?? dto.audioBase64,
      sample_rate: dto.sample_rate ?? dto.sampleRate,
      user_id: dto.user_id ?? dto.userId,
      currentLat: dto.currentLat,
      currentLng: dto.currentLng,
      accessibilityFlag: dto.accessibilityFlag,
    });
  }

  @Post('turn')
  turnAlias(@Body() dto: VoiceTurnDto) {
    return this.turn(dto);
  }

  @Post('voice/conversation')
  async conversation(@Body() dto: VoiceTurnDto) {
    if (!dto.session_id && !dto.sessionId && !dto.transcript && !dto.audio_base64 && !dto.audioBase64) {
      return this.voice.start(dto.user_id ?? dto.userId);
    }
    return this.turn(dto);
  }

  @Get('voice/session/:id')
  getSession(@Param('id') id: string) {
    return this.voice.getSession(id);
  }

  @Get('session/:id')
  getSessionAlias(@Param('id') id: string) {
    return this.getSession(id);
  }

  @Get('voice/sessions')
  listSessions() {
    return { sessions: this.voice.listSessions() };
  }

  @Get('sessions')
  listSessionsAlias() {
    return this.listSessions();
  }
}
