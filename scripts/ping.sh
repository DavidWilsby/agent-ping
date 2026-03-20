#!/bin/bash
# Agent Ping — plays a sound when Claude finishes responding.
#
# Custom sound: set AGENT_PING_SOUND=/path/to/sound.wav in your settings.json env section.
# Default sound: sounds/ping.wav in this plugin directory.

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_SOUND="$PLUGIN_DIR/sounds/ping.wav"
SOUND="${AGENT_PING_SOUND:-$DEFAULT_SOUND}"

[ -f "$SOUND" ] || exit 0

case "$(uname -s)" in
  Darwin)
    afplay "$SOUND" &
    ;;
  Linux)
    if command -v paplay &>/dev/null; then
      paplay "$SOUND" &
    elif command -v aplay &>/dev/null; then
      aplay "$SOUND" &
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    powershell -c "(New-Object Media.SoundPlayer '$SOUND').PlaySync()" &
    ;;
esac
