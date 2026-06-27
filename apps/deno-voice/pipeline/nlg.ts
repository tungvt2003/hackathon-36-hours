import type { Intent, NLGRequest, NLGResponse } from "../types.ts";

export function renderNLG(req: NLGRequest): NLGResponse {
  let plainText = "";

  // Status line
  if (req.status_line) {
    plainText += req.status_line + ". ";
  }

  // Body
  if (req.body) {
    plainText += req.body + " ";
  }

  // Options list
  if (req.options && req.options.length > 0) {
    const optLines = req.options.map((o) => {
      let line = `${o.index}, ${o.label}`;
      if (o.detail) line += `, ${o.detail}`;
      return line;
    });
    plainText += optLines.join("; ") + ". ";

    if (req.has_more_options) {
      plainText += "Nói \"nghe thêm\" để xem tiếp. ";
    }
  }

  // Escape hint
  if (req.escape_hint) {
    plainText += req.escape_hint + ". ";
  }

  // Confirm question
  if (req.confirm_question) {
    plainText += req.confirm_question + " ";
  }

  plainText = plainText.trim();

  // Build SSML
  const ssml = buildSSML(plainText, req);

  // Determine expected intents based on template
  const expectedIntents = getExpectedIntents(req);

  return {
    ssml,
    plain_text: plainText,
    earcon_pre: null,
    earcon_post: req.earcon_post ?? null,
    expects_input: req.template !== "INFORM" || !plainText.endsWith("!"),
    expected_intents: expectedIntents,
  };
}

function buildSSML(text: string, req: NLGRequest): string {
  let ssml = "<speak>";

  if (req.status_line) {
    ssml += `${req.status_line}. <break time="300ms"/>`;
  }

  if (req.body) {
    ssml += `${req.body} <break time="200ms"/>`;
  }

  if (req.options && req.options.length > 0) {
    for (const opt of req.options) {
      ssml += `<break time="200ms"/>${opt.index}, ${opt.label}`;
      if (opt.detail) ssml += `, ${opt.detail}`;
      ssml += "; ";
    }
  }

  if (req.escape_hint) {
    ssml += `<break time="300ms"/>${req.escape_hint}. `;
  }

  if (req.confirm_question) {
    ssml += `<break time="300ms"/>${req.confirm_question}`;
  }

  ssml += "</speak>";
  return ssml;
}

function getExpectedIntents(req: NLGRequest): Intent[] {
  const base: Intent[] = ["GLOBAL_REPEAT", "GLOBAL_HELP", "GLOBAL_CANCEL"];

  switch (req.template) {
    case "GREETING":
      return [...base, "NAVIGATE", "ORDER_FOOD", "REQUEST_SUGGESTIONS"];
    case "OFFER_OPTIONS":
    case "DISAMBIGUATE":
      return [...base, "SELECT_OPTION", "GLOBAL_MORE_OPTIONS", "GLOBAL_REPEAT_OPTIONS"];
    case "CONFIRM_EXPLICIT":
    case "ORDER_SUMMARY":
      return [...base, "CONFIRM_YES", "CONFIRM_NO"];
    case "NUDGE":
      return [...base, "SELECT_OPTION", "CONFIRM_YES", "CONFIRM_NO"];
    case "INFORM":
      return [...base];
    case "ERROR":
      return [...base, "NAVIGATE", "ORDER_FOOD"];
    default:
      return base;
  }
}
