#!/usr/bin/env node
import { resolveConfig } from './config';
import { handleEvent, EventType } from './ping';
import { removeHooksAndConfig } from './uninstall';

const arg = process.argv[2];

if (arg === '--version' || arg === '-v') {
  const { version } = require('../package.json');
  console.log(version);
  process.exit(0);
}

if (arg === 'uninstall') {
  removeHooksAndConfig();
  process.exit(0);
}

const event = arg as EventType;
const validEvents: EventType[] = ['stop', 'notification'];

if (!validEvents.includes(event)) {
  process.exit(0);
}

const config = resolveConfig();

if (event === 'notification') {
  let stdin = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk: string) => { stdin += chunk; });
  process.stdin.on('end', () => {
    handleEvent(event, stdin, config);
  });
} else {
  handleEvent(event, '', config);
}
