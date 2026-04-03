#!/usr/bin/env node
import { resolveConfig } from './config';
import { handleEvent, EventType } from './ping';

const arg = process.argv[2];

if (arg === 'config') {
  import('./configure').then(({ configure }) => configure()).catch(() => process.exit(1));
} else {
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
}
