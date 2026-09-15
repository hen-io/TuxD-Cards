
(function () {
  'use strict';

  const CARD_TAG = 'tuxd-terminal-card';
  const DEFAULT_TITLE = 'Terminal';
  const DEFAULT_MAX_LINES = 300;
  const DEFAULT_HEIGHT = '320px';

  const STYLE = `
    :host { display: block; }
    .card {
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #0b0f10, #0d1512);
      border-radius: 14px;
      border: 1px solid rgba(70, 255, 170, 0.14);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 0 40px rgba(46, 255, 170, 0.03);
      overflow: hidden;
      font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      color: #d7ffe9;
    }
    .titlebar {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .dots {
      display: flex;
      gap: 6px;
      flex: 0 0 auto;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.red { background: #ff5f57; }
    .dot.yellow { background: #febc2e; }
    .dot.green { background: #28c840; }
    .title {
      flex: 1 1 auto;
      text-align: center;
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(215, 255, 233, 0.55);
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .actions { flex: 0 0 auto; display: flex; }
    .clear {
      background: transparent;
      border: none;
      color: rgba(215, 255, 233, 0.45);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 4px 6px;
      border-radius: 6px;
      font-family: inherit;
    }
    .clear:hover { background: rgba(255, 255, 255, 0.08); color: #eafff5; }
    .output {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.5;
      min-height: 120px;
    }
    .output::-webkit-scrollbar { width: 8px; }
    .output::-webkit-scrollbar-thumb { background: rgba(46, 255, 170, 0.18); border-radius: 8px; }
    .line {
      white-space: pre-wrap;
      word-break: break-word;
      opacity: 0;
      animation: tuxd-fadein 0.15s ease forwards;
    }
    .line.cmd { color: #7ce6ff; }
    @keyframes tuxd-fadein {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .inputrow {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(255, 255, 255, 0.02);
    }
    .prompt { color: #2ee6a5; font-weight: 600; }
    input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      color: #eafff5;
      font: inherit;
      font-size: 13px;
      caret-color: #2ee6a5;
    }
    input::placeholder { color: rgba(215, 255, 233, 0.28); }
    button.send {
      flex: 0 0 auto;
      background: rgba(46, 255, 170, 0.1);
      border: 1px solid rgba(46, 255, 170, 0.3);
      color: #2ee6a5;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }
    button.send:hover { background: rgba(46, 255, 170, 0.18); }
    button.send:active { transform: translateY(1px); }
    .unavailable { padding: 16px; color: #ff8a8a; font-size: 13px; }
  `;

  class TuxdTerminalCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._history = [];
      this._historyIndex = 0;
      this._lastOutputState = undefined;
      this._unavailable = false;
    }

    setConfig(config) {
      if (!config || !config.input_entity || !config.output_entity) {
        throw new Error('tuxd-terminal-card: "input_entity" and "output_entity" are required');
      }
      this._config = Object.assign(
        { title: DEFAULT_TITLE, max_lines: DEFAULT_MAX_LINES, height: DEFAULT_HEIGHT },
        config
      );
      this._lastOutputState = undefined;
      this._unavailable = false;
      if (this._hass) {
        this._render();
      }
    }

    set hass(hass) {
      const isFirst = !this._hass;
      this._hass = hass;
      if (!this._config) return;
      if (isFirst) {
        this._render();
      }
      this._updateAvailability();
      if (!this._unavailable) {
        this._syncOutput(isFirst);
      }
    }

    get hass() {
      return this._hass;
    }

    getCardSize() {
      return 6;
    }

    static getStubConfig(hass, entities) {
      const list = entities || [];
      const input = list.find((e) => e.indexOf('text.') === 0 && e.indexOf('terminal_input') !== -1);
      const output = list.find((e) => e.indexOf('sensor.') === 0 && e.indexOf('terminal_output') !== -1);
      return {
        type: 'custom:' + CARD_TAG,
        title: DEFAULT_TITLE,
        input_entity: input || '',
        output_entity: output || '',
      };
    }

    _updateAvailability() {
      const inState = this._hass.states[this._config.input_entity];
      const outState = this._hass.states[this._config.output_entity];
      const missing = !inState || !outState;

      if (missing && !this._unavailable) {
        this._unavailable = true;
        this._renderUnavailable(!inState ? this._config.input_entity : this._config.output_entity);
      } else if (!missing && this._unavailable) {
        this._unavailable = false;
        this._lastOutputState = undefined;
        this._render();
      }
    }

    _renderUnavailable(missingEntity) {
      const root = this.shadowRoot;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = STYLE;
      root.appendChild(style);

      const card = document.createElement('div');
      card.className = 'card';
      const msg = document.createElement('div');
      msg.className = 'unavailable';
      msg.textContent = 'Entity not found: ' + missingEntity;
      card.appendChild(msg);
      root.appendChild(card);
    }

    _render() {
      const root = this.shadowRoot;
      root.innerHTML = '';

      const style = document.createElement('style');
      style.textContent = STYLE;
      root.appendChild(style);

      const card = document.createElement('div');
      card.className = 'card';

      const titlebar = document.createElement('div');
      titlebar.className = 'titlebar';

      const dots = document.createElement('div');
      dots.className = 'dots';
      ['red', 'yellow', 'green'].forEach((c) => {
        const d = document.createElement('span');
        d.className = 'dot ' + c;
        dots.appendChild(d);
      });
      titlebar.appendChild(dots);

      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = this._config.title || DEFAULT_TITLE;
      titlebar.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'actions';
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear';
      clearBtn.type = 'button';
      clearBtn.title = 'Clear screen';
      clearBtn.textContent = '✕';
      clearBtn.addEventListener('click', () => {
        this._outputEl.innerHTML = '';
      });
      actions.appendChild(clearBtn);
      titlebar.appendChild(actions);

      card.appendChild(titlebar);

      const output = document.createElement('div');
      output.className = 'output';
      output.style.maxHeight = this._config.height || DEFAULT_HEIGHT;
      output.addEventListener('mouseup', () => {
        const sel = window.getSelection();
        if (!sel || sel.toString() === '') {
          this._inputEl.focus();
        }
      });
      card.appendChild(output);
      this._outputEl = output;

      const inputrow = document.createElement('div');
      inputrow.className = 'inputrow';

      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = '❯';
      inputrow.appendChild(prompt);

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Type a command and press Enter...';
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.spellcheck = false;
      input.addEventListener('keydown', (ev) => this._onKeydown(ev));
      inputrow.appendChild(input);
      this._inputEl = input;

      const send = document.createElement('button');
      send.className = 'send';
      send.type = 'button';
      send.textContent = 'Run';
      send.addEventListener('click', () => this._submit());
      inputrow.appendChild(send);

      card.appendChild(inputrow);
      root.appendChild(card);
    }

    _syncOutput(firstRun) {
      if (!this._outputEl) return;
      const state = this._hass.states[this._config.output_entity];
      if (!state) return;

      const value = state.state;
      if (value === this._lastOutputState) return;

      const wasEmptyStart = firstRun && this._lastOutputState === undefined;
      this._lastOutputState = value;

      if (value === 'unavailable' || value === 'unknown') return;
      if (wasEmptyStart && value === '') return;

      this._appendLine(value);
    }

    _appendLine(text) {
      const isCmd = typeof text === 'string' && text.indexOf('$ ') === 0;
      const line = document.createElement('div');
      line.className = isCmd ? 'line cmd' : 'line';
      line.textContent = text === '' ? ' ' : text;
      this._outputEl.appendChild(line);

      const max = this._config.max_lines || DEFAULT_MAX_LINES;
      while (this._outputEl.children.length > max) {
        this._outputEl.removeChild(this._outputEl.firstChild);
      }

      this._outputEl.scrollTop = this._outputEl.scrollHeight;
    }

    _onKeydown(ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        this._submit();
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        this._historyStep(-1);
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        this._historyStep(1);
      }
    }

    _historyStep(direction) {
      if (!this._history.length) return;
      this._historyIndex += direction;
      if (this._historyIndex < 0) this._historyIndex = 0;
      if (this._historyIndex >= this._history.length) {
        this._historyIndex = this._history.length;
        this._inputEl.value = '';
        return;
      }
      this._inputEl.value = this._history[this._historyIndex];
      const pos = this._inputEl.value.length;
      window.requestAnimationFrame(() => {
        this._inputEl.setSelectionRange(pos, pos);
      });
    }

    _submit() {
      const value = (this._inputEl.value || '').trim();
      if (!value || !this._hass || !this._config) return;

      this._history.push(value);
      if (this._history.length > 100) this._history.shift();
      this._historyIndex = this._history.length;

      const domain = this._config.input_entity.split('.')[0];
      this._hass.callService(domain, 'set_value', {
        entity_id: this._config.input_entity,
        value: value,
      });

      this._inputEl.value = '';
    }
  }

  customElements.define(CARD_TAG, TuxdTerminalCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: 'TuxD Terminal Card',
    description: 'A terminal-styled card for running commands through a TuxD terminal_input/terminal_output entity pair.',
  });
})();
