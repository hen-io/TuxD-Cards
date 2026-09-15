<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo.png">
    <img src="logo.png" alt="TuxD" height="250em">
  </picture>
</p>

# TuxD *nix companion - Lovelace cards

Home Assistant companion Lovelace cards for [TuxD](https://github.com/hen-io/tuxd) - a *nix monitoring
and management agent for Home Assistant. This repository ships three cards:

- **Terminal card** (`tuxd-terminal-card.js`) - a terminal-styled card that drives TuxD's
  `terminal_input`/`terminal_output` entity pair, with a Stop button (or Ctrl+C) to cancel a
  running command, command history, output scrollback, themes, and a visual editor.
- **Update card** (`tuxd-update-card.js`) - shows TuxD's `update` entity (available package/kernel
  updates) with a one-click install button, and a visual editor.
- **Site Cache card** (`tuxd-cache-card.js`) - a standalone utility card, not tied to TuxD or any
  entity: shows Home Assistant frontend's own Cache Storage usage with a button to clear it.

[![Open your Home Assistant instance and add this repository to HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=hen-io&repository=TuxD-Cards&category=dashboard)

## Setup

HACS only auto-registers one Lovelace resource per repository (`tuxd-terminal-card.js`). After
installing via HACS, add the other two as extra resources yourself:

**Settings -> Dashboards -> ⋮ -> Resources -> Add resource**

- URL: `/hacsfiles/TuxD-Cards/tuxd-update-card.js` - Resource type: JavaScript module
- URL: `/hacsfiles/TuxD-Cards/tuxd-cache-card.js` - Resource type: JavaScript module

Then add any card to a dashboard as `custom:tuxd-terminal-card` / `custom:tuxd-update-card` /
`custom:tuxd-cache-card` - all three ship a UI editor, so no YAML is required.
