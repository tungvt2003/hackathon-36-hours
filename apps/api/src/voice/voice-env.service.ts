import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

@Injectable()
export class VoiceEnvService {
  private localEnv: Record<string, string> | null = null;

  constructor(private readonly config: ConfigService) {}

  get(name: string, fallback = ''): string {
    const processValue = this.config.get<string>(name) ?? process.env[name];
    if (processValue !== undefined) return processValue;
    return this.readLocalEnv()[name] ?? fallback;
  }

  getFirst(names: string[], fallback = ''): string {
    for (const name of names) {
      const value = this.get(name);
      if (value !== '') return value;
    }
    return fallback;
  }

  private readLocalEnv(): Record<string, string> {
    if (this.localEnv) return this.localEnv;

    this.localEnv = {};
    const repoRoot = resolve(process.cwd(), '../..');
    const candidates = [
      resolve(process.cwd(), '.env'),
      resolve(process.cwd(), 'apps/api/.env'),
      resolve(process.cwd(), 'apps/deno-voice/.env'),
      resolve(repoRoot, '.env'),
      resolve(repoRoot, 'apps/api/.env'),
      resolve(repoRoot, 'apps/deno-voice/.env'),
    ];

    for (const path of candidates) {
      if (!existsSync(path)) continue;
      this.localEnv = this.parseEnvFile(readFileSync(path, 'utf8'));
      break;
    }

    return this.localEnv;
  }

  private parseEnvFile(text: string): Record<string, string> {
    const parsed: Record<string, string> = {};

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separator = line.indexOf('=');
      if (separator <= 0) continue;

      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      parsed[key] = value;
    }

    return parsed;
  }
}
