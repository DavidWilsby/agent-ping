import * as fs from 'fs';

const QUESTION_PATTERN = /\?[\s]*$|want me to|would you like|do you want|shall I|let me know/i;

const ACTIONABLE_PATTERN = /\?[\s]*$|want me to|would you like|do you want|shall I|let me know|approve|allow|permission|waiting|paused/i;

export function detectActionableMessage(message: string): boolean {
  return ACTIONABLE_PATTERN.test(message.slice(-500));
}

export function detectQuestion(transcriptPath: string): boolean {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');
    let lastText = '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as {
          type?: string;
          message?: { content?: Array<{ type?: string; text?: string }> };
        };
        if (obj.type === 'assistant') {
          for (const block of obj.message?.content ?? []) {
            if (block.type === 'text' && block.text) {
              lastText = block.text.trim();
            }
          }
        }
      } catch {
        // skip malformed lines
      }
    }

    return QUESTION_PATTERN.test(lastText.slice(-500));
  } catch {
    return false;
  }
}
