import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceFlowService } from './voice-flow.service';
import type { VoiceFlowRequest } from './voice-flow.types';
import { Express } from 'express';

/**
 * Endpoint cho AI Service gửi JSON theo contract đã thỏa thuận.
 *
 * POST /voice-flow       — xử lý từng step
 * POST /voice-flow/audio — nhận audio từ app, đẩy sang AI Service, rồi gọi handle()
 * GET  /voice-flow/session/:id — xem session hiện tại (debug)
 */
@Controller('voice-flow')
export class VoiceFlowController {
  constructor(private readonly svc: VoiceFlowService) { }

  @Post()
  handle(@Body() req: VoiceFlowRequest) {
    return this.svc.handle(req);
  }

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio'))
  handleAudio(
    @UploadedFile() file: any,
    @Body() body: any
  ) {
    return this.svc.processAudio(file, body);
  }

  /** Debug: xem session đang lưu trong cache */
  @Get('session/:id')
  getSession(@Param('id') id: string) {
    const session = this.svc.getSession(id);
    if (!session) return { status: 'not_found', session_id: id };
    return { status: 'found', session };
  }
}
