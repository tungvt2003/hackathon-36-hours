const ENV_FILE_CANDIDATES = [".env", "apps/deno-voice/.env"];

let localEnv: Record<string, string> | null = null;

export function getEnv(name: string, fallback = ""): string {
  const value = readProcessEnv(name);
  if (value !== undefined) return value;

  return readLocalEnv()[name] ?? fallback;
}

function readProcessEnv(name: string): string | undefined {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
}

function readLocalEnv(): Record<string, string> {
  if (localEnv) return localEnv;

  localEnv = {};
  for (const path of ENV_FILE_CANDIDATES) {
    try {
      localEnv = parseEnvFile(Deno.readTextFileSync(path));
      break;
    } catch {
      // Missing .env or no read permission: keep env-only behavior.
    }
  }

  return localEnv;
}

function parseEnvFile(text: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
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
