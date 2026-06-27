import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VoiceFlowService } from './voice-flow.service';
import type { VoiceFlowRequest } from './voice-flow.types';

/**
 * Endpoint cho AI Service gửi JSON theo contract đã thỏa thuận.
 *
 * POST /voice-flow       — xử lý từng step
 * GET  /voice-flow/session/:id — xem session hiện tại (debug)
 */
@Controller('voice-flow')
export class VoiceFlowController {
  constructor(private readonly svc: VoiceFlowService) { }

  @Post()
  handle(@Body() req: VoiceFlowRequest) {
    return this.svc.handle(req);
  }

  /** Debug: xem session đang lưu trong cache */
  @Get('session/:id')
  getSession(@Param('id') id: string) {
    const session = this.svc.getSession(id);
    if (!session) return { status: 'not_found', session_id: id };
    return { status: 'found', session };
  }
}
