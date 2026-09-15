
(function () {
  'use strict';

  const CARD_TAG = 'tuxd-card';
  const EDITOR_TAG = 'tuxd-card-editor';
  const CARD_VERSION = '0.1.7';

  function resolveLang(raw) {
    const l = String(raw || '').toLowerCase();
    return (l === 'nb' || l === 'nn' || l === 'no') ? 'nb' : 'en';
  }

  const LANGUAGE_OPTIONS = [
    { value: '', label: 'Auto' },
    { value: 'en', label: 'English' },
    { value: 'nb', label: 'Norsk (bokmål)' },
  ];

  const I18N = {
    en: {
      cardType: 'Card type',
      cardTypeOptions: { terminal: 'Terminal', update: 'Updates', cache: 'Site Cache' },
      terminal: {
        title: 'Terminal',
        placeholder: 'Type a command and press Enter...',
        clear: 'Clear screen',
        notFound: 'Entity not found: ',
        run: 'Run',
        stop: 'Stop running command (or press Ctrl+C)',
        editor: {
          input_entity: 'Input entity (text)',
          output_entity: 'Output entity (sensor)',
          title: 'Title',
          height: 'Height (e.g. 320px)',
          max_lines: 'Max lines',
          auto_scroll: 'Auto-scroll',
          text_color: 'Text color (e.g. #7ce6ff)',
          text_size: 'Text size (e.g. 13px)',
          language: 'Language',
          theme: 'Theme',
          max_history: 'Max command history',
          background_color: 'Output background color',
          hide_header: 'Hide header (terminal only)',
        },
      },
      update: {
        defaultTitle: 'Updates',
        upToDate: 'Up to date',
        installed: 'Installed',
        install: 'Install',
        installing: 'Installing...',
        updatesHeading: 'Updates',
        releaseNotes: 'Release notes',
        notFound: 'Entity not found: ',
        kernel: 'Kernel',
        newKernel: 'New kernel',
        editor: {
          entity: 'Update entity',
          title: 'Title',
          expanded: 'Update list expanded by default',
          language: 'Language',
        },
      },
      cache: {
        defaultTitle: 'Site Cache',
        calculating: 'Calculating…',
        notSupported: 'Not supported by this browser',
        clear: 'Clear cache',
        clearing: 'Clearing...',
        cleared: 'Cleared',
        used: 'Used',
        of: 'of',
        empty: 'Cache is empty',
        editor: {
          title: 'Title',
          language: 'Language',
        },
      },
    },
    nb: {
      cardType: 'Korttype',
      cardTypeOptions: { terminal: 'Terminal', update: 'Oppdateringer', cache: 'Nettsted-cache' },
      terminal: {
        title: 'Terminal',
        placeholder: 'Skriv en kommando og trykk Enter...',
        clear: 'Tøm skjermen',
        notFound: 'Finner ikke enhet: ',
        run: 'Kjør',
        stop: 'Stopp kjørende kommando (eller trykk Ctrl+C)',
        editor: {
          input_entity: 'Input-entitet (text)',
          output_entity: 'Output-entitet (sensor)',
          title: 'Tittel',
          height: 'Høyde (f.eks. 320px)',
          max_lines: 'Maks antall linjer',
          auto_scroll: 'Automatisk rulling',
          text_color: 'Tekstfarge (f.eks. #7ce6ff)',
          text_size: 'Tekststørrelse (f.eks. 13px)',
          language: 'Språk',
          theme: 'Tema',
          max_history: 'Maks kommandohistorikk',
          background_color: 'Bakgrunnsfarge (output)',
          hide_header: 'Skjul topptekst (kun terminal)',
        },
      },
      update: {
        defaultTitle: 'Oppdateringer',
        upToDate: 'Oppdatert',
        installed: 'Installert',
        install: 'Installer',
        installing: 'Installerer...',
        updatesHeading: 'Oppdateringer',
        releaseNotes: 'Utgivelsesnotater',
        notFound: 'Finner ikke enhet: ',
        kernel: 'Kjerne',
        newKernel: 'Ny kjerne',
        editor: {
          entity: 'Oppdateringsenhet',
          title: 'Tittel',
          expanded: 'Oppdateringsliste åpen som standard',
          language: 'Språk',
        },
      },
      cache: {
        defaultTitle: 'Nettsted-cache',
        calculating: 'Beregner…',
        notSupported: 'Støttes ikke av denne nettleseren',
        clear: 'Tøm cache',
        clearing: 'Tømmer...',
        cleared: 'Tømt',
        used: 'Brukt',
        of: 'av',
        empty: 'Cachen er tom',
        editor: {
          title: 'Tittel',
          language: 'Språk',
        },
      },
    },
  };

  function modeDict(lang, mode) {
    return (I18N[lang] && I18N[lang][mode]) || I18N.en[mode];
  }


  const DEFAULT_MAX_LINES = 300;
  const DEFAULT_HEIGHT = '320px';
  const DEFAULT_MAX_HISTORY = 100;
  const STOP_SENTINEL = '__tuxd_stop__';

  const THEMES = {
    ha: {},
    green: {
      bg: '#0a0f0c', text: '#39ff6a', textRgb: '57, 255, 106',
      accent: '#39ff6a', accentRgb: '57, 255, 106', border: 'rgba(57, 255, 106, 0.25)',
    },
    amber: {
      bg: '#100b06', text: '#ffb000', textRgb: '255, 176, 0',
      accent: '#ffb000', accentRgb: '255, 176, 0', border: 'rgba(255, 176, 0, 0.25)',
    },
    blue: {
      bg: '#060b14', text: '#5ad1ff', textRgb: '90, 209, 255',
      accent: '#5ad1ff', accentRgb: '90, 209, 255', border: 'rgba(90, 209, 255, 0.25)',
    },
    light: {
      bg: '#f7f8f7', text: '#1b1f1e', textRgb: '27, 31, 30',
      accent: '#1c8f6e', accentRgb: '28, 143, 110', border: 'rgba(0, 0, 0, 0.12)',
    },
  };

  const THEME_OPTIONS = [
    { value: 'ha', label: 'Home Assistant (default)' },
    { value: 'green', label: 'Classic Green' },
    { value: 'amber', label: 'Amber' },
    { value: 'blue', label: 'Cyberpunk Blue' },
    { value: 'light', label: 'Light' },
  ];

  const TERMINAL_STYLE = `
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
      flex: 0 0 auto;
      overflow-y: auto;
      padding: 12px 16px;
      font-size: var(--tuxd-text-size, 13px);
      line-height: 1.5;
      box-sizing: border-box;
      background: var(--tuxd-output-bg, var(--secondary-background-color, transparent));
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
      background: var(--tuxd-output-bg, var(--secondary-background-color, transparent));
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
      font-size: var(--tuxd-text-size, 13px);
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
    button.stop {
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
    button.stop svg { width: 18px; height: 18px; fill: currentColor; }
    button.stop:hover {
      background: rgba(var(--rgb-error-color, 219, 68, 55), 0.12);
      color: var(--error-color, #db4437);
    }
    button.stop:active { transform: translateY(1px); }
    .unavailable { padding: 16px; color: var(--error-color, #db4437); font-size: 13px; }
  `;

  class TerminalRenderer {
    constructor(root) {
      this.root = root;
      this._history = [];
      this._historyIndex = 0;
      this._lastOutputState = undefined;
      this._unavailable = false;
    }

    static defaultConfig() {
      return {
        max_lines: DEFAULT_MAX_LINES,
        height: DEFAULT_HEIGHT,
        auto_scroll: true,
        max_history: DEFAULT_MAX_HISTORY,
        theme: 'ha',
        hide_header: false,
      };
    }

    static schema() {
      return [
        { name: 'input_entity', required: true, selector: { entity: { domain: ['text', 'input_text'] } } },
        { name: 'output_entity', required: true, selector: { entity: { domain: ['sensor'] } } },
        { name: 'title', selector: { text: {} } },
        { name: 'theme', selector: { select: { mode: 'dropdown', options: THEME_OPTIONS } } },
        { name: 'height', selector: { text: {} } },
        { name: 'max_lines', selector: { number: { mode: 'box', min: 10, max: 5000 } } },
        { name: 'max_history', selector: { number: { mode: 'box', min: 0, max: 1000 } } },
        { name: 'auto_scroll', selector: { boolean: {} } },
        { name: 'hide_header', selector: { boolean: {} } },
        { name: 'text_color', selector: { text: {} } },
        { name: 'text_size', selector: { text: {} } },
        { name: 'background_color', selector: { text: {} } },
        { name: 'language', selector: { select: { mode: 'dropdown', options: LANGUAGE_OPTIONS } } },
      ];
    }

    static hasCandidate(entities) {
      return (entities || []).some((e) => e.indexOf('text.') === 0 && e.indexOf('terminal_input') !== -1);
    }

    static stubFields(entities) {
      const list = entities || [];
      const input = list.find((e) => e.indexOf('text.') === 0 && e.indexOf('terminal_input') !== -1);
      const output = list.find((e) => e.indexOf('sensor.') === 0 && e.indexOf('terminal_output') !== -1);
      return { input_entity: input || '', output_entity: output || '' };
    }

    setConfig(config) {
      if (!config || !config.input_entity || !config.output_entity) {
        throw new Error('tuxd-card (terminal): "input_entity" and "output_entity" are required');
      }
      this._config = Object.assign(TerminalRenderer.defaultConfig(), config);
      this._lastOutputState = undefined;
      this._unavailable = false;
      if (this._historyLoadedFor !== this._config.input_entity) {
        this._historyLoadedFor = this._config.input_entity;
        this._loadHistory();
      }
      if (this._hass) {
        this._render();
      }
    }

    setHass(hass) {
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

    getCardSize() {
      return 6;
    }

    _lang() {
      if (this._config && this._config.language) return resolveLang(this._config.language);
      const hassLang = this._hass && (this._hass.language || (this._hass.locale && this._hass.locale.language));
      return resolveLang(hassLang);
    }

    _t(key) {
      const dict = modeDict(this._lang(), 'terminal');
      return dict[key] || I18N.en.terminal[key] || key;
    }

    _historyKey() {
      return `tuxd-terminal-card-history:${this._config.input_entity}`;
    }

    _loadHistory() {
      this._history = [];
      try {
        const raw = window.localStorage.getItem(this._historyKey());
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) this._history = parsed.filter((v) => typeof v === 'string');
      } catch (e) {
      }
      this._historyIndex = this._history.length;
    }

    _saveHistory() {
      try {
        window.localStorage.setItem(this._historyKey(), JSON.stringify(this._history));
      } catch (e) {
      }
    }

    _outputHistoryKey() {
      return `tuxd-terminal-card-output:${this._config.output_entity}`;
    }

    _loadOutputHistory() {
      try {
        const raw = window.localStorage.getItem(this._outputHistoryKey());
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
          parsed.forEach((line) => this._appendLine(line, false));
        }
      } catch (e) {
      }
    }

    _saveOutputHistory() {
      try {
        const lines = Array.from(this._outputEl.children).map((el) => el.textContent);
        window.localStorage.setItem(this._outputHistoryKey(), JSON.stringify(lines));
      } catch (e) {
      }
    }

    _clearOutputHistory() {
      try {
        window.localStorage.removeItem(this._outputHistoryKey());
      } catch (e) {
      }
    }

    _applyTheme(card) {
      const theme = THEMES[this._config.theme] || THEMES.ha;
      if (theme.bg) {
        card.style.setProperty('--ha-card-background', theme.bg);
        card.style.setProperty('--card-background-color', theme.bg);
        card.style.setProperty('--secondary-background-color', 'transparent');
      }
      if (theme.text) {
        card.style.setProperty('--primary-text-color', theme.text);
        card.style.setProperty('--secondary-text-color', theme.text);
      }
      if (theme.textRgb) {
        card.style.setProperty('--rgb-primary-text-color', theme.textRgb);
      }
      if (theme.accent) {
        card.style.setProperty('--primary-color', theme.accent);
      }
      if (theme.accentRgb) {
        card.style.setProperty('--rgb-primary-color', theme.accentRgb);
      }
      if (theme.border) {
        card.style.setProperty('--divider-color', theme.border);
      }
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
      const root = this.root;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = TERMINAL_STYLE;
      root.appendChild(style);

      const card = document.createElement('ha-card');
      this._applyTheme(card);
      const msg = document.createElement('div');
      msg.className = 'unavailable';
      msg.textContent = this._t('notFound') + missingEntity;
      card.appendChild(msg);
      root.appendChild(card);
    }

    _render() {
      const root = this.root;
      root.innerHTML = '';

      const style = document.createElement('style');
      style.textContent = TERMINAL_STYLE;
      root.appendChild(style);

      const card = document.createElement('ha-card');
      this._applyTheme(card);
      if (this._config.text_color) {
        card.style.setProperty('--tuxd-text-color', this._config.text_color);
      }
      if (this._config.text_size) {
        const size = typeof this._config.text_size === 'number' ? `${this._config.text_size}px` : this._config.text_size;
        card.style.setProperty('--tuxd-text-size', size);
      }
      if (this._config.background_color) {
        card.style.setProperty('--tuxd-output-bg', this._config.background_color);
      }

      if (!this._config.hide_header) {
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
          this._clearOutputHistory();
        });
        header.appendChild(clearBtn);

        card.appendChild(header);
      }

      const output = document.createElement('div');
      output.className = 'output';
      output.style.height = this._config.height || DEFAULT_HEIGHT;
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

      const stop = document.createElement('button');
      stop.className = 'stop';
      stop.type = 'button';
      stop.title = this._t('stop');
      stop.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>';
      stop.addEventListener('click', () => this._stopCommand());
      inputrow.appendChild(stop);

      const send = document.createElement('button');
      send.className = 'send';
      send.type = 'button';
      send.textContent = this._t('run');
      send.addEventListener('click', () => this._submit());
      inputrow.appendChild(send);

      card.appendChild(inputrow);
      root.appendChild(card);

      this._loadOutputHistory();

      if (this._config.auto_scroll !== false) {
        window.requestAnimationFrame(() => {
          if (this._outputEl) this._outputEl.scrollTop = this._outputEl.scrollHeight;
        });
      }
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

    _appendLine(text, persist) {
      const isCmd = typeof text === 'string' && (/^\S+:~\$ /.test(text) || text.indexOf('$ ') === 0);
      const line = document.createElement('div');
      line.className = isCmd ? 'line cmd' : 'line';
      line.textContent = text === '' ? ' ' : text;
      this._outputEl.appendChild(line);

      const max = this._config.max_lines || DEFAULT_MAX_LINES;
      while (this._outputEl.children.length > max) {
        this._outputEl.removeChild(this._outputEl.firstChild);
      }

      if (this._config.auto_scroll !== false) {
        this._outputEl.scrollTop = this._outputEl.scrollHeight;
      }

      if (persist !== false) this._saveOutputHistory();
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
      } else if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'c' || ev.key === 'C')) {
        const input = ev.target;
        const inputHasSelection = typeof input.selectionStart === 'number' && input.selectionStart !== input.selectionEnd;
        const docSel = window.getSelection();
        const docHasSelection = !!(docSel && String(docSel).length);
        if (!inputHasSelection && !docHasSelection) {
          ev.preventDefault();
          this._stopCommand();
        }
      }
    }

    _stopCommand() {
      if (!this._hass || !this._config || !this._config.input_entity) return;
      const domain = this._config.input_entity.split('.')[0];
      this._hass.callService(domain, 'set_value', {
        entity_id: this._config.input_entity,
        value: STOP_SENTINEL,
      });
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
      const maxHistory = this._config.max_history === 0 ? 0 : (this._config.max_history || DEFAULT_MAX_HISTORY);
      while (this._history.length > maxHistory) this._history.shift();
      this._historyIndex = this._history.length;
      this._saveHistory();

      const domain = this._config.input_entity.split('.')[0];
      this._hass.callService(domain, 'set_value', {
        entity_id: this._config.input_entity,
        value: value,
      });

      this._inputEl.value = '';
    }
  }


  const UPDATE_STYLE = `
    :host { display: block; }
    ha-card {
      display: flex;
      flex-direction: column;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--primary-text-color);
      gap: 12px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icon {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--rgb-warning-color, 255, 152, 0), 0.24);
      color: var(--warning-color, #ffa726);
      animation: tuxd-pulse-ring 2s ease-in-out infinite;
    }
    .icon.uptodate {
      background: rgba(102, 187, 106, 0.24);
      color: var(--success-color, #66bb6a);
      animation: none;
    }
    @keyframes tuxd-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(var(--rgb-warning-color, 255, 152, 0), 0.45); }
      50% { box-shadow: 0 0 0 6px rgba(var(--rgb-warning-color, 255, 152, 0), 0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .icon { animation: none; }
    }
    .icon svg { width: 20px; height: 20px; }
    .info { flex: 1 1 auto; min-width: 0; }
    .title {
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .versions {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kernel {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
    }
    .kernel svg {
      flex: 0 0 auto;
      width: 13px;
      height: 13px;
      fill: currentColor;
    }
    .kernel span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .kernel .new-kernel {
      font-weight: 600;
      color: var(--warning-color, #ff9800);
    }
    button.install {
      flex: 0 0 auto;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    button.install:hover { filter: brightness(1.08); }
    button.install:active { transform: translateY(1px); }
    button.install[disabled] { opacity: 0.6; cursor: default; }
    .installing {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .spinner {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(var(--rgb-primary-color, 3, 169, 244), 0.25);
      border-top-color: var(--primary-color);
      animation: tuxd-spin 0.8s linear infinite;
    }
    @keyframes tuxd-spin { to { transform: rotate(360deg); } }
    details.changelog {
      border-top: 1px solid var(--divider-color);
      padding-top: 10px;
    }
    summary.changelog-heading {
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text-color);
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      user-select: none;
    }
    summary.changelog-heading::-webkit-details-marker { display: none; }
    summary.changelog-heading .heading-text { color: var(--primary-color); }
    summary.changelog-heading .chevron-btn {
      flex: 0 0 auto;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--secondary-text-color);
    }
    summary.changelog-heading:hover .chevron-btn {
      background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
      color: var(--primary-text-color);
    }
    summary.changelog-heading .chevron {
      width: 20px;
      height: 20px;
      transition: transform 0.15s ease;
    }
    details[open] summary.changelog-heading .chevron { transform: rotate(180deg); }
    .summary-text {
      margin-top: 10px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--primary-text-color);
      white-space: pre-wrap;
      max-height: 220px;
      overflow-y: auto;
    }
    a.release-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--secondary-text-color);
      text-decoration: none;
    }
    a.release-link:hover { color: var(--primary-color); }
    a.release-link svg { width: 12px; height: 12px; }
    .unavailable { color: var(--error-color, #db4437); font-size: 13px; }
  `;

  class UpdateRenderer {
    constructor(root) {
      this.root = root;
    }

    static defaultConfig() {
      return { expanded: false };
    }

    static schema() {
      return [
        { name: 'entity', required: true, selector: { entity: { domain: ['update'] } } },
        { name: 'title', selector: { text: {} } },
        { name: 'expanded', selector: { boolean: {} } },
        { name: 'language', selector: { select: { mode: 'dropdown', options: LANGUAGE_OPTIONS } } },
      ];
    }

    static hasCandidate(entities) {
      return (entities || []).some((e) => e.indexOf('update.') === 0);
    }

    static stubFields(entities) {
      const list = entities || [];
      const entity = list.find((e) => e.indexOf('update.') === 0);
      return { entity: entity || '' };
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error('tuxd-card (update): "entity" is required');
      }
      this._config = Object.assign(UpdateRenderer.defaultConfig(), config);
      this._lastSig = undefined;
      if (this._hass) this._syncFromHass();
    }

    setHass(hass) {
      this._hass = hass;
      if (!this._config) return;
      this._syncFromHass();
    }

    getCardSize() {
      return 3;
    }

    _lang() {
      if (this._config && this._config.language) return resolveLang(this._config.language);
      const hassLang = this._hass && (this._hass.language || (this._hass.locale && this._hass.locale.language));
      return resolveLang(hassLang);
    }

    _t(key) {
      const dict = modeDict(this._lang(), 'update');
      return dict[key] || I18N.en.update[key] || key;
    }

    _syncFromHass() {
      const stateObj = this._hass.states[this._config.entity];
      if (!stateObj) {
        this._lastSig = 'unavailable';
        this._renderUnavailable();
        return;
      }
      const sig = JSON.stringify(stateObj);
      if (sig === this._lastSig) return;
      this._lastSig = sig;
      this._render(stateObj);
    }

    _renderUnavailable() {
      const root = this.root;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = UPDATE_STYLE;
      root.appendChild(style);

      const card = document.createElement('ha-card');
      const msg = document.createElement('div');
      msg.className = 'unavailable';
      msg.textContent = this._t('notFound') + this._config.entity;
      card.appendChild(msg);
      root.appendChild(card);
    }

    _render(stateObj) {
      const root = this.root;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = UPDATE_STYLE;
      root.appendChild(style);

      const attrs = stateObj.attributes || {};
      const installed = attrs.installed_version || '';
      const latest = attrs.latest_version || installed;
      const updateAvailable = stateObj.state === 'on';
      const inProgress = !!attrs.in_progress;
      const summary = attrs.release_summary || '';
      const releaseUrl = attrs.release_url || '';
      const kernelVersion = attrs.kernel_version || '';
      const latestKernelVersion = attrs.latest_kernel_version || '';

      const card = document.createElement('ha-card');

      const row = document.createElement('div');
      row.className = 'row';

      const icon = document.createElement('div');
      icon.className = 'icon' + (updateAvailable ? '' : ' uptodate');
      icon.innerHTML = updateAvailable
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM12 2 5 9h4v6h6V9h4l-7-7z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
      row.appendChild(icon);

      const info = document.createElement('div');
      info.className = 'info';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = this._config.title || this._t('defaultTitle');
      info.appendChild(title);
      const versions = document.createElement('div');
      versions.className = 'versions';
      versions.textContent = updateAvailable
        ? `${this._t('installed')} ${installed} → ${latest}`
        : `${this._t('upToDate')} • ${installed}`;
      info.appendChild(versions);

      if (kernelVersion) {
        const kernel = document.createElement('div');
        kernel.className = 'kernel';
        kernel.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 2h2v2H9V2zm4 0h2v2h-2V2zM9 20h2v2H9v-2zm4 0h2v2h-2v-2zM2 9h2v2H2V9zm0 4h2v2H2v-2zM20 9h2v2h-2V9zm0 4h2v2h-2v-2zM6 6h12v12H6V6z"/></svg>';
        const kernelText = document.createElement('span');
        kernelText.appendChild(document.createTextNode(`${this._t('kernel')} ${kernelVersion}`));
        if (latestKernelVersion && latestKernelVersion !== kernelVersion) {
          kernelText.appendChild(document.createTextNode(' → '));
          const newKernel = document.createElement('span');
          newKernel.className = 'new-kernel';
          newKernel.textContent = latestKernelVersion;
          kernelText.appendChild(newKernel);
        }
        kernel.appendChild(kernelText);
        info.appendChild(kernel);
      }

      row.appendChild(info);

      if (inProgress) {
        const installing = document.createElement('div');
        installing.className = 'installing';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        installing.appendChild(spinner);
        const label = document.createElement('span');
        label.textContent = this._t('installing');
        installing.appendChild(label);
        row.appendChild(installing);
      } else if (updateAvailable) {
        const btn = document.createElement('button');
        btn.className = 'install';
        btn.type = 'button';
        btn.textContent = this._t('install');
        btn.addEventListener('click', () => this._install(btn));
        row.appendChild(btn);
      }

      card.appendChild(row);

      if (summary) {
        const changelog = document.createElement('details');
        changelog.className = 'changelog';
        changelog.open = this._config.expanded === true;

        const heading = document.createElement('summary');
        heading.className = 'changelog-heading';
        const headingText = document.createElement('span');
        headingText.className = 'heading-text';
        headingText.textContent = this._t('updatesHeading');
        heading.appendChild(headingText);
        const chevronBtn = document.createElement('span');
        chevronBtn.className = 'chevron-btn';
        chevronBtn.innerHTML = '<svg class="chevron" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
        heading.appendChild(chevronBtn);
        changelog.appendChild(heading);

        const text = document.createElement('div');
        text.className = 'summary-text';
        text.textContent = summary;
        changelog.appendChild(text);

        if (releaseUrl) {
          const link = document.createElement('a');
          link.className = 'release-link';
          link.href = releaseUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.innerHTML = this._t('releaseNotes') + ' <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/></svg>';
          changelog.appendChild(link);
        }

        card.appendChild(changelog);
      }

      root.appendChild(card);
    }

    _install(btn) {
      if (!this._hass || !this._config) return;
      btn.disabled = true;
      btn.textContent = this._t('installing');
      this._hass.callService('update', 'install', { entity_id: this._config.entity });
    }
  }


  const CACHE_STYLE = `
    :host { display: block; }
    ha-card {
      display: flex;
      flex-direction: column;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--primary-text-color);
      gap: 12px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icon {
      flex: 0 0 auto;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.14);
      color: var(--primary-color);
    }
    .icon.cleared {
      background: rgba(var(--rgb-disabled-color, 148, 148, 148), 0.14);
      color: var(--disabled-text-color, var(--secondary-text-color));
    }
    .icon svg { width: 20px; height: 20px; }
    .info { flex: 1 1 auto; min-width: 0; }
    .title {
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .detail {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    button.clear-cache {
      flex: 0 0 auto;
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
      border: 1px solid rgba(var(--rgb-primary-color, 3, 169, 244), 0.35);
      color: var(--primary-color);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    button.clear-cache:hover { background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.18); }
    button.clear-cache:active { transform: translateY(1px); }
    button.clear-cache[disabled] { opacity: 0.6; cursor: default; }
    .bar-track {
      height: 6px;
      border-radius: 3px;
      background: var(--divider-color);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 3px;
      background: var(--primary-color);
      transition: width 0.3s ease;
    }
    .caches {
      font-size: 12px;
      color: var(--secondary-text-color);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .caches .cache-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .caches .cache-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .unavailable { color: var(--error-color, #db4437); font-size: 13px; }
  `;

  async function getCacheInfo() {
    const info = { supported: !!(window.caches && caches.keys), caches: [], usage: null, quota: null };
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        info.usage = typeof est.usage === 'number' ? est.usage : null;
        info.quota = typeof est.quota === 'number' ? est.quota : null;
      } catch (e) {
      }
    }
    if (info.supported) {
      try {
        const names = await caches.keys();
        for (const name of names) {
          let count = null;
          try {
            const c = await caches.open(name);
            const keys = await c.keys();
            count = keys.length;
          } catch (e) {
          }
          info.caches.push({ name, count });
        }
      } catch (e) {
      }
    }
    return info;
  }

  function formatBytes(bytes) {
    if (bytes == null || isNaN(bytes)) return '—';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  class CacheRenderer {
    constructor(root) {
      this.root = root;
      this._info = null;
      this._status = 'idle';
    }

    static defaultConfig() {
      return {};
    }

    static schema() {
      return [
        { name: 'title', selector: { text: {} } },
        { name: 'language', selector: { select: { mode: 'dropdown', options: LANGUAGE_OPTIONS } } },
      ];
    }

    static hasCandidate() {
      return true;
    }

    static stubFields() {
      return {};
    }

    setConfig(config) {
      this._config = Object.assign(CacheRenderer.defaultConfig(), config);
      this._render();
      if (!this._info) this._refresh();
    }

    setHass(hass) {
      this._hass = hass;
    }

    connectedCallback() {
      if (!this._info) this._refresh();
    }

    getCardSize() {
      return 2;
    }

    _lang() {
      if (this._config && this._config.language) return resolveLang(this._config.language);
      const hassLang = this._hass && (this._hass.language || (this._hass.locale && this._hass.locale.language));
      return resolveLang(hassLang);
    }

    _t(key) {
      const dict = modeDict(this._lang(), 'cache');
      return dict[key] || I18N.en.cache[key] || key;
    }

    async _refresh() {
      this._info = await getCacheInfo();
      this._render();
    }

    async _clear() {
      if (!this._info || !this._info.supported) return;
      this._status = 'clearing';
      this._render();
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch (e) {
      }
      await this._refresh();
      this._status = 'cleared';
      this._render();
      setTimeout(() => {
        this._status = 'idle';
        this._render();
      }, 2000);
    }

    _render() {
      const config = this._config || {};

      const root = this.root;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = CACHE_STYLE;
      root.appendChild(style);

      const card = document.createElement('ha-card');
      const row = document.createElement('div');
      row.className = 'row';

      const info = this._info;
      const justCleared = this._status === 'cleared';

      const icon = document.createElement('div');
      icon.className = 'icon' + (justCleared ? ' cleared' : '');
      icon.innerHTML = justCleared
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 4V3H9v1H4v2h16V4h-5zM6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/></svg>';
      row.appendChild(icon);

      const infoDiv = document.createElement('div');
      infoDiv.className = 'info';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = config.title || this._t('defaultTitle');
      infoDiv.appendChild(title);

      const detail = document.createElement('div');
      detail.className = 'detail';
      if (!info) {
        detail.textContent = this._t('calculating');
      } else if (!info.supported) {
        detail.textContent = this._t('notSupported');
      } else if (justCleared) {
        detail.textContent = this._t('cleared');
      } else if (info.usage != null && info.quota) {
        detail.textContent = `${this._t('used')} ${formatBytes(info.usage)} ${this._t('of')} ${formatBytes(info.quota)}`;
      } else if (info.caches.length === 0) {
        detail.textContent = this._t('empty');
      } else {
        const items = info.caches.reduce((sum, c) => sum + (c.count || 0), 0);
        detail.textContent = `${info.caches.length} cache(s), ${items} item(s)`;
      }
      infoDiv.appendChild(detail);
      row.appendChild(infoDiv);

      const btn = document.createElement('button');
      btn.className = 'clear-cache';
      btn.type = 'button';
      btn.textContent = this._status === 'clearing' ? this._t('clearing') : this._t('clear');
      btn.disabled = !info || !info.supported || this._status === 'clearing';
      btn.addEventListener('click', () => this._clear());
      row.appendChild(btn);

      card.appendChild(row);

      if (info && info.supported && info.usage != null && info.quota) {
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        const pct = info.quota > 0 ? Math.min(100, (info.usage / info.quota) * 100) : 0;
        fill.style.width = `${pct}%`;
        track.appendChild(fill);
        card.appendChild(track);
      }

      if (info && info.supported && info.caches.length > 0 && !justCleared) {
        const list = document.createElement('div');
        list.className = 'caches';
        info.caches.forEach((c) => {
          const cacheRow = document.createElement('div');
          cacheRow.className = 'cache-row';
          const name = document.createElement('span');
          name.className = 'cache-name';
          name.textContent = c.name;
          cacheRow.appendChild(name);
          const count = document.createElement('span');
          count.textContent = c.count == null ? '—' : String(c.count);
          cacheRow.appendChild(count);
          list.appendChild(cacheRow);
        });
        card.appendChild(list);
      }

      root.appendChild(card);
    }
  }


  const RENDERERS = { terminal: TerminalRenderer, update: UpdateRenderer, cache: CacheRenderer };
  const DEFAULT_CARD_TYPE = 'terminal';

  class TuxdCardBase extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._renderer = null;
      this._cardType = null;
    }

    get _forcedType() {
      return null;
    }

    setConfig(config) {
      if (!config) {
        throw new Error('tuxd-card: config is required');
      }
      const cardType = this._forcedType || config.card || DEFAULT_CARD_TYPE;
      const Renderer = RENDERERS[cardType];
      if (!Renderer) {
        throw new Error(`tuxd-card: unknown card type "${cardType}"`);
      }
      if (cardType !== this._cardType) {
        this._cardType = cardType;
        this.shadowRoot.innerHTML = '';
        this._renderer = new Renderer(this.shadowRoot);
        if (this._renderer.connectedCallback) this._renderer.connectedCallback();
      }
      this._renderer.setConfig(config);
      if (this._hass) this._renderer.setHass(this._hass);
    }

    set hass(hass) {
      this._hass = hass;
      if (this._renderer) this._renderer.setHass(hass);
    }

    get hass() {
      return this._hass;
    }

    connectedCallback() {
      if (this._renderer && this._renderer.connectedCallback) this._renderer.connectedCallback();
    }

    getCardSize() {
      return this._renderer ? this._renderer.getCardSize() : 1;
    }
  }

  class TuxdCard extends TuxdCardBase {
    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig(hass, entities) {
      const cardType = TerminalRenderer.hasCandidate(entities)
        ? 'terminal'
        : (UpdateRenderer.hasCandidate(entities) ? 'update' : 'cache');
      return Object.assign(
        { type: 'custom:' + CARD_TAG, card: cardType },
        RENDERERS[cardType].stubFields(entities)
      );
    }
  }

  class TuxdTerminalCardLegacy extends TuxdCardBase {
    get _forcedType() { return 'terminal'; }
    static getConfigElement() { return document.createElement('tuxd-terminal-card-editor'); }
    static getStubConfig(hass, entities) {
      return Object.assign({ type: 'custom:tuxd-terminal-card' }, TerminalRenderer.stubFields(entities));
    }
  }

  class TuxdUpdateCardLegacy extends TuxdCardBase {
    get _forcedType() { return 'update'; }
    static getConfigElement() { return document.createElement('tuxd-update-card-editor'); }
    static getStubConfig(hass, entities) {
      return Object.assign({ type: 'custom:tuxd-update-card' }, UpdateRenderer.stubFields(entities));
    }
  }

  class TuxdCacheCardLegacy extends TuxdCardBase {
    get _forcedType() { return 'cache'; }
    static getConfigElement() { return document.createElement('tuxd-cache-card-editor'); }
    static getStubConfig() {
      return Object.assign({ type: 'custom:tuxd-cache-card' }, CacheRenderer.stubFields());
    }
  }


  function cardTypeOptionsFor(lang) {
    const labels = (I18N[lang] || I18N.en).cardTypeOptions;
    return [
      { value: 'terminal', label: labels.terminal },
      { value: 'update', label: labels.update },
      { value: 'cache', label: labels.cache },
    ];
  }

  class TuxdCardEditorBase extends HTMLElement {
    get _forcedType() {
      return null;
    }

    setConfig(config) {
      this._config = Object.assign({}, config);
      this._buildForm();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._form) this._form.hass = hass;
      this._buildForm();
    }

    get hass() {
      return this._hass;
    }

    connectedCallback() {
      this._buildForm();
    }

    _lang() {
      if (this._config && this._config.language) return resolveLang(this._config.language);
      const hassLang = this._hass && (this._hass.language || (this._hass.locale && this._hass.locale.language));
      return resolveLang(hassLang);
    }

    _cardType() {
      return this._forcedType || (this._config && this._config.card) || DEFAULT_CARD_TYPE;
    }

    _schema() {
      const modeSchema = RENDERERS[this._cardType()].schema();
      if (this._forcedType) return modeSchema;
      const cardField = {
        name: 'card',
        required: true,
        selector: { select: { mode: 'dropdown', options: cardTypeOptionsFor(this._lang()) } },
      };
      return [cardField].concat(modeSchema);
    }

    _computeLabel(schema) {
      const lang = this._lang();
      if (schema.name === 'card') return (I18N[lang] || I18N.en).cardType;
      const dict = modeDict(lang, this._cardType()).editor;
      return dict[schema.name] || schema.name;
    }

    _buildForm() {
      if (!this._config || !this.isConnected) return;

      const cardType = this._cardType();

      if (!this._form) {
        this._config = Object.assign({ card: cardType }, RENDERERS[cardType].defaultConfig(), this._config);
        this._lastSchemaType = cardType;

        this._form = document.createElement('ha-form');
        this._form.computeLabel = (schema) => this._computeLabel(schema);
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const next = Object.assign({}, ev.detail.value);
          Object.keys(next).forEach((k) => {
            if (next[k] === '' || next[k] === undefined) delete next[k];
          });
          if (this._forcedType) delete next.card;
          this._config = next;
          this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          }));
        });

        const versionLabel = document.createElement('div');
        versionLabel.textContent = `TuxD Card v${CARD_VERSION}`;
        versionLabel.style.cssText = 'font-size: 11px; color: var(--secondary-text-color, #888); text-align: right; margin-bottom: 4px;';
        this.appendChild(versionLabel);

        this.appendChild(this._form);
      } else if (cardType !== this._lastSchemaType) {
        this._lastSchemaType = cardType;
        this._config = Object.assign({ type: this._config.type, card: cardType }, RENDERERS[cardType].defaultConfig());
        this.dispatchEvent(new CustomEvent('config-changed', {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        }));
      }

      if (this._hass) this._form.hass = this._hass;
      this._form.schema = this._schema();
      this._form.data = this._config;
    }
  }

  class TuxdCardEditor extends TuxdCardEditorBase {}
  class TuxdTerminalCardEditorLegacy extends TuxdCardEditorBase { get _forcedType() { return 'terminal'; } }
  class TuxdUpdateCardEditorLegacy extends TuxdCardEditorBase { get _forcedType() { return 'update'; } }
  class TuxdCacheCardEditorLegacy extends TuxdCardEditorBase { get _forcedType() { return 'cache'; } }

  customElements.define(EDITOR_TAG, TuxdCardEditor);
  customElements.define(CARD_TAG, TuxdCard);

  customElements.define('tuxd-terminal-card-editor', TuxdTerminalCardEditorLegacy);
  customElements.define('tuxd-terminal-card', TuxdTerminalCardLegacy);
  customElements.define('tuxd-update-card-editor', TuxdUpdateCardEditorLegacy);
  customElements.define('tuxd-update-card', TuxdUpdateCardLegacy);
  customElements.define('tuxd-cache-card-editor', TuxdCacheCardEditorLegacy);
  customElements.define('tuxd-cache-card', TuxdCacheCardLegacy);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: 'TuxD Card',
    description: 'Terminal, Updates, or Site Cache - pick with the Card type field. Covers all three TuxD companion cards from one resource.',
  });
})();