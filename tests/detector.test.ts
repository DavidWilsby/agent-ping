import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function writeTranscript(lines: object[]): string {
  const tmpPath = path.join(os.tmpdir(), `agent-ping-test-${Date.now()}.jsonl`);
  fs.writeFileSync(tmpPath, lines.map(l => JSON.stringify(l)).join('\n'));
  return tmpPath;
}

afterEach(() => {
  // Clean up temp files
  fs.readdirSync(os.tmpdir())
    .filter(f => f.startsWith('agent-ping-test-'))
    .forEach(f => fs.unlinkSync(path.join(os.tmpdir(), f)));
});

describe('detectQuestion', () => {
  it('returns false for empty transcript', () => {
    const p = writeTranscript([]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(false);
  });

  it('returns false when last message does not look like a question', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Done. The files have been updated.' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(false);
  });

  it('returns true when last message ends with ?', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Shall I proceed?' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(true);
  });

  it('returns true for "would you like" pattern', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Would you like me to run the tests?' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(true);
  });

  it('returns true for "want me to" pattern', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'I can fix this — want me to proceed?' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(true);
  });

  it('uses last assistant message only, not earlier ones', () => {
    const p = writeTranscript([
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Would you like to proceed?' }] } },
      { type: 'user', message: { content: [{ type: 'text', text: 'yes' }] } },
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Done.' }] } },
    ]);
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(p)).toBe(false);
  });

  it('returns false for nonexistent transcript path', () => {
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion('/nonexistent/path.jsonl')).toBe(false);
  });

  it('skips malformed JSON lines without throwing', () => {
    const tmpPath = path.join(os.tmpdir(), `agent-ping-test-${Date.now()}.jsonl`);
    fs.writeFileSync(tmpPath, 'not json\n{"type":"assistant","message":{"content":[{"type":"text","text":"Done."}]}}\n');
    const { detectQuestion } = require('../src/detector');
    expect(detectQuestion(tmpPath)).toBe(false);
  });
});
