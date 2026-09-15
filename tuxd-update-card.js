
(function () {
  'use strict';

  const CARD_TAG = 'tuxd-update-card';
  const EDITOR_TAG = 'tuxd-update-card-editor';

  const I18N = {
    en: {
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
    nb: {
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
    { name: 'entity', required: true, selector: { entity: { domain: ['update'] } } },
    { name: 'title', selector: { text: {} } },
    { name: 'expanded', selector: { boolean: {} } },
    { name: 'language', selector: { select: { mode: 'dropdown', options: LANGUAGE_OPTIONS } } },
  ];

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
      background: rgba(var(--rgb-warning-color, 255, 152, 0), 0.14);
      color: var(--warning-color, #ff9800);
      animation: tuxd-pulse-ring 2s ease-in-out infinite;
    }
    .icon.uptodate {
      background: rgba(var(--rgb-disabled-color, 148, 148, 148), 0.14);
      color: var(--disabled-text-color, var(--secondary-text-color));
      animation: none;
    }
    @keyframes tuxd-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(var(--rgb-warning-color, 255, 152, 0), 0.35); }
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
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 2px;
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
      color: var(--primary-color);
      list-style: none;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }
    summary.changelog-heading::-webkit-details-marker { display: none; }
    summary.changelog-heading .chevron {
      width: 10px;
      height: 10px;
      flex: 0 0 auto;
      transition: transform 0.15s ease;
    }
    details[open] summary.changelog-heading .chevron { transform: rotate(90deg); }
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

  class TuxdUpdateCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error('tuxd-update-card: "entity" is required');
      }
      this._config = config;
      this._lastSig = undefined;
      if (this._hass) this._syncFromHass();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._config) return;
      this._syncFromHass();
    }

    get hass() {
      return this._hass;
    }

    getCardSize() {
      return 3;
    }

    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig(hass, entities) {
      const list = entities || [];
      const entity = list.find((e) => e.indexOf('update.') === 0);
      return { type: 'custom:' + CARD_TAG, entity: entity || '' };
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
      const root = this.shadowRoot;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = STYLE;
      root.appendChild(style);

      const card = document.createElement('ha-card');
      const msg = document.createElement('div');
      msg.className = 'unavailable';
      msg.textContent = this._t('notFound') + this._config.entity;
      card.appendChild(msg);
      root.appendChild(card);
    }

    _render(stateObj) {
      const root = this.shadowRoot;
      root.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = STYLE;
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
        kernel.appendChild(document.createTextNode(`${this._t('kernel')} ${kernelVersion}`));
        if (latestKernelVersion && latestKernelVersion !== kernelVersion) {
          kernel.appendChild(document.createTextNode(' → '));
          const newKernel = document.createElement('span');
          newKernel.className = 'new-kernel';
          newKernel.textContent = latestKernelVersion;
          kernel.appendChild(newKernel);
        }
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
        heading.innerHTML = '<svg class="chevron" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        heading.appendChild(document.createTextNode(this._t('updatesHeading')));
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

  class TuxdUpdateCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = Object.assign({ expanded: false }, config);
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

  customElements.define(EDITOR_TAG, TuxdUpdateCardEditor);
  customElements.define(CARD_TAG, TuxdUpdateCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: 'TuxD Update Card',
    description: 'Shows a TuxD (or any Home Assistant) update entity with changelog and a one-click install button.',
  });
})();
