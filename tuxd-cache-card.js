
(function () {
  'use strict';

  const CARD_TAG = 'tuxd-cache-card';
  const EDITOR_TAG = 'tuxd-cache-card-editor';

  const I18N = {
    en: {
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
    nb: {
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
  };

  function resolveLang(raw) {
    const l = String(raw || '').toLowerCase();
    return (l === 'nb' || l === 'nn' || l === 'no') ? 'nb' : 'en';
  }

  const LANGUAGE_OPTIONS = [
    { value: '', label: 'Auto' },
    { value: 'en', label: 'English' },
    { value: 'nb', label: 'Norsk (bokmål)' },
  ];

  const EDITOR_SCHEMA = [
    { name: 'title', selector: { text: {} } },
    { name: 'language', selector: { select: { mode: 'dropdown', options: LANGUAGE_OPTIONS } } },
  ];

  function formatBytes(bytes) {
    if (bytes == null || isNaN(bytes)) return '—';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  const STYLE = `
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

  class TuxdCacheCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._info = null;
      this._status = 'idle';
    }

    setConfig(config) {
      this._config = Object.assign({}, config);
      this._render();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (first) this._render();
    }

    get hass() {
      return this._hass;
    }

    connectedCallback() {
      if (!this._info) this._refresh();
    }

    getCardSize() {
      return 2;
    }

    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
      return { type: 'custom:' + CARD_TAG };
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
      const root = this.shadowRoot;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = STYLE;
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
      title.textContent = this._config.title || this._t('defaultTitle');
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

  class TuxdCacheCardEditor extends HTMLElement {
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

    _buildForm() {
      if (!this._config || !this.isConnected) return;

      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.computeLabel = (schema) => {
          const dict = (I18N[this._lang()] || I18N.en).editor;
          return dict[schema.name] || schema.name;
        };
        this._form.addEventListener('value-changed', (ev) => {
          ev.stopPropagation();
          const next = Object.assign({}, ev.detail.value);
          Object.keys(next).forEach((k) => {
            if (next[k] === '' || next[k] === undefined) delete next[k];
          });
          this._config = next;
          this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          }));
        });
        this.appendChild(this._form);
      }

      if (this._hass) this._form.hass = this._hass;
      this._form.schema = EDITOR_SCHEMA;
      this._form.data = this._config;
    }
  }

  customElements.define(EDITOR_TAG, TuxdCacheCardEditor);
  customElements.define(CARD_TAG, TuxdCacheCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: 'TuxD Site Cache Card',
    description: 'Shows this site\'s Cache Storage usage with a button to clear it. Not tied to any TuxD entity.',
  });
})();
