import { getEventMessage } from '../src/messages';

describe('getEventMessage', () => {
  it('returns stop message for stop event', () => {
    const msg = getEventMessage('stop');
    expect(msg.title).toBe('Agent Ping');
    expect(msg.message).toContain('finished');
  });

  it('returns idle_prompt message', () => {
    const msg = getEventMessage('notification', 'idle_prompt');
    expect(msg.message).toContain('waiting');
  });

  it('returns elicitation_dialog message', () => {
    const msg = getEventMessage('notification', 'elicitation_dialog');
    expect(msg.message).toContain('question');
  });

  it('returns PermissionRequest message', () => {
    const msg = getEventMessage('notification', 'PermissionRequest');
    expect(msg.message).toContain('permission');
  });

  it('returns StopFailure message', () => {
    const msg = getEventMessage('notification', 'StopFailure');
    expect(msg.message).toContain('error');
  });

  it('returns fallback message for unknown event', () => {
    const msg = getEventMessage('unknown_event', 'unknown_sub');
    expect(msg.title).toBe('Agent Ping');
    expect(msg.message).toContain('attention');
  });
});
