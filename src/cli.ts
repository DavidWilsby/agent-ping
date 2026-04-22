#!/usr/bin/env node
import { resolveConfig } from './config';
import { handleEvent, EventType } from './ping';
import { migrateIfNeeded } from './migrate';

// Hydrate CLAUDE_PLUGIN_DATA from argv[3] when the hook passed it positionally.
// This is the cross-platform path: inline `VAR=value cmd` shell syntax does not
// parse in Windows cmd.exe, so hooks.json passes the data dir as an argument
// and cli.ts promotes it into the environment before config is resolved.
const pluginDataArg = process.argv[3];
if (pluginDataArg && !pluginDataArg.includes('${') && !process.env.CLAUDE_PLUGIN_DATA) {
  process.env.CLAUDE_PLUGIN_DATA = pluginDataArg;
}

migrateIfNeeded();

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
