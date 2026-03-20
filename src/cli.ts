#!/usr/bin/env node
import { resolveConfig } from './config';
import { handleEvent, EventType } from './ping';

const event = process.argv[2] as EventType;
const validEvents: EventType[] = ['stop', 'notification', 'permission'];

if (!validEvents.includes(event)) {
  process.exit(0);
}

let stdin = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk: string) => { stdin += chunk; });
process.stdin.on('end', async () => {
  const config = resolveConfig();
  await handleEvent(event, stdin, config);
});
