#!/usr/bin/env node
import { resolveConfig } from './config';
import { handleEvent, handleFilteredNotification, EventType } from './ping';

const event = process.argv[2] as EventType;
const filtered = process.argv[3] === '--filtered';
const validEvents: EventType[] = ['stop', 'notification'];

if (!validEvents.includes(event)) {
  process.exit(0);
}

const config = resolveConfig();

if (event === 'notification' && filtered) {
  let stdin = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk: string) => { stdin += chunk; });
  process.stdin.on('end', () => {
    handleFilteredNotification(stdin, config);
  });
} else {
  handleEvent(event, '', config);
}
