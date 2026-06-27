import { Injectable } from '@nestjs/common';
import { VoiceIntent, VoiceNlgRequest, VoiceNlgResponse } from './voice.types';

@Injectable()
export class VoiceNlgService {
  render(req: VoiceNlgRequest): VoiceNlgResponse {
    let plainText = '';

    if (req.status_line) {
      plainText += `${req.status_line}. `;
    }

    if (req.body) {
      plainText += `${req.body} `;
    }

    if (req.options?.length) {
      const optLines = req.options.map((option) => {
        let line = `${option.index}, ${option.label}`;
        if (option.detail) line += `, ${option.detail}`;
        return line;
      });
      plainText += `${optLines.join('; ')}. `;

      if (req.has_more_options) {
        plainText += 'Say "more options" to see more. ';
      }
    }

    if (req.escape_hint) {
      plainText += `${req.escape_hint}. `;
    }

    if (req.confirm_question) {
      plainText += `${req.confirm_question} `;
    }

    plainText = plainText.trim();

    return {
      ssml: this.buildSsml(req),
      plain_text: plainText,
      earcon_pre: null,
      earcon_post: req.earcon_post ?? null,
      expects_input: req.template !== 'INFORM' || !plainText.endsWith('!'),
      expected_intents: this.getExpectedIntents(req),
    };
  }

  private buildSsml(req: VoiceNlgRequest): string {
    let ssml = '<speak>';

    if (req.status_line) {
      ssml += `${this.escapeXml(req.status_line)}. <break time="300ms"/>`;
    }

    if (req.body) {
      ssml += `${this.escapeXml(req.body)} <break time="200ms"/>`;
    }

    if (req.options?.length) {
      for (const option of req.options) {
        ssml += `<break time="200ms"/>${option.index}, ${this.escapeXml(option.label)}`;
        if (option.detail) ssml += `, ${this.escapeXml(option.detail)}`;
        ssml += '; ';
      }
    }

    if (req.escape_hint) {
      ssml += `<break time="300ms"/>${this.escapeXml(req.escape_hint)}. `;
    }

    if (req.confirm_question) {
      ssml += `<break time="300ms"/>${this.escapeXml(req.confirm_question)}`;
    }

    ssml += '</speak>';
    return ssml;
  }

  private getExpectedIntents(req: VoiceNlgRequest): VoiceIntent[] {
    const base: VoiceIntent[] = [
      'GLOBAL_REPEAT',
      'GLOBAL_HELP',
      'GLOBAL_CANCEL',
    ];

    switch (req.template) {
      case 'GREETING':
        return [...base, 'NAVIGATE', 'ORDER_FOOD', 'REQUEST_SUGGESTIONS'];
      case 'OFFER_OPTIONS':
      case 'DISAMBIGUATE':
        return [
          ...base,
          'SELECT_OPTION',
          'GLOBAL_MORE_OPTIONS',
          'GLOBAL_REPEAT_OPTIONS',
        ];
      case 'CONFIRM_EXPLICIT':
      case 'ORDER_SUMMARY':
        return [...base, 'CONFIRM_YES', 'CONFIRM_NO'];
      case 'NUDGE':
        return [...base, 'SELECT_OPTION', 'CONFIRM_YES', 'CONFIRM_NO'];
      case 'ERROR':
        return [...base, 'NAVIGATE', 'ORDER_FOOD'];
      case 'INFORM':
      default:
        return base;
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
