
(function () {
  'use strict';

  const CARD_TAG = 'tuxd-terminal-card';
  const DEFAULT_MAX_LINES = 300;
  const DEFAULT_HEIGHT = '320px';

  const I18N = {
    en: {
      title: 'Terminal',
      placeholder: 'Type a command and press Enter...',
      clear: 'Clear screen',
      notFound: 'Entity not found: ',
      run: 'Run',
    },
    nb: {
      title: 'Terminal',
      placeholder: 'Skriv en kommando og trykk Enter...',
      clear: 'Tøm skjermen',
      notFound: 'Finner ikke enhet: ',
      run: 'Kjør',
    },
  };

  function resolveLang(raw) {
    const l = String(raw || '').toLowerCase();
    return (l === 'nb' || l === 'nn' || l === 'no') ? 'nb' : 'en';
  }

  const STYLE = `
    :host { display: block; }
    ha-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      color: var(--primary-text-color);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    .title {
      flex: 1 1 auto;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
      color: var(--secondary-text-color);
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .clear {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
      font-family: inherit;
    }
    .clear svg { width: 16px; height: 16px; fill: currentColor; }
    .clear:hover {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
      color: var(--primary-text-color);
    }
    .output {
      flex: 1;
      overflow-y: auto;
      padding: 12px 16px;
      font-size: var(--tuxd-text-size, 13px);
      line-height: 1.5;
      min-height: 120px;
      background: var(--secondary-background-color, transparent);
    }
    .output::-webkit-scrollbar { width: 8px; }
    .output::-webkit-scrollbar-thumb { background: var(--divider-color); border-radius: 8px; }
    .line {
      white-space: pre-wrap;
      word-break: break-word;
      opacity: 0;
      animation: tuxd-fadein 0.15s ease forwards;
      color: var(--tuxd-text-color, var(--primary-text-color));
    }
    .line.cmd { color: var(--tuxd-text-color, var(--primary-color)); }
    @keyframes tuxd-fadein {
      from { opacity: 0; transform: translateY(2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .inputrow {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-top: 1px solid var(--divider-color);
    }
    .prompt { color: var(--primary-color); font-weight: 600; }
    input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      caret-color: var(--primary-color);
    }
    input::placeholder { color: var(--secondary-text-color); opacity: 0.7; }
    button.send {
      flex: 0 0 auto;
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
      border: 1px solid rgba(var(--rgb-primary-color, 3, 169, 244), 0.35);
      color: var(--primary-color);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }
    button.send:hover { background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.18); }
    button.send:active { transform: translateY(1px); }
    .unavailable { padding: 16px; color: var(--error-color, #db4437); font-size: 13px; }
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
        { max_lines: DEFAULT_MAX_LINES, height: DEFAULT_HEIGHT, auto_scroll: true },
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
        input_entity: input || '',
        output_entity: output || '',
      };
    }

    _lang() {
      if (this._config && this._config.language) return resolveLang(this._config.language);
      const hassLang = this._hass && (this._hass.language || (this._hass.locale && this._hass.locale.language));
      return resolveLang(hassLang);
    }

    _t(key) {
      const dict = I18N[this._lang()] || I18N.en;
      return dict[key] || I18N.en[key] || key;
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

      const card = document.createElement('ha-card');
      const msg = document.createElement('div');
      msg.className = 'unavailable';
      msg.textContent = this._t('notFound') + missingEntity;
      card.appendChild(msg);
      root.appendChild(card);
    }

    _render() {
      const root = this.shadowRoot;
      root.innerHTML = '';

      const style = document.createElement('style');
      style.textContent = STYLE;
      root.appendChild(style);

      const card = document.createElement('ha-card');
      if (this._config.text_color) {
        card.style.setProperty('--tuxd-text-color', this._config.text_color);
      }
      if (this._config.text_size) {
        const size = typeof this._config.text_size === 'number' ? `${this._config.text_size}px` : this._config.text_size;
        card.style.setProperty('--tuxd-text-size', size);
      }

      const header = document.createElement('div');
      header.className = 'header';

      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = this._config.title || this._t('title');
      header.appendChild(title);

      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear';
      clearBtn.type = 'button';
      clearBtn.title = this._t('clear');
      clearBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/></svg>';
      clearBtn.addEventListener('click', () => {
        this._outputEl.innerHTML = '';
      });
      header.appendChild(clearBtn);

      card.appendChild(header);

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
      input.placeholder = this._t('placeholder');
      input.autocomplete = 'off';
      input.autocapitalize = 'off';
      input.spellcheck = false;
      input.addEventListener('keydown', (ev) => this._onKeydown(ev));
      inputrow.appendChild(input);
      this._inputEl = input;

      const send = document.createElement('button');
      send.className = 'send';
      send.type = 'button';
      send.textContent = this._t('run');
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

      if (this._config.auto_scroll !== false) {
        this._outputEl.scrollTop = this._outputEl.scrollHeight;
      }
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
