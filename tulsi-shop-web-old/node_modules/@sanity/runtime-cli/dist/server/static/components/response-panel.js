/* globals customElements document */
/* eslint-disable unicorn/prefer-dom-node-text-content */

import {
  basicSetup,
  EditorState,
  EditorView,
  json,
  prettyBytes,
  prettyMilliseconds,
} from '../vendor/vendor.bundle.js'
import {ApiBaseElement} from './api-base.js'
import {sanityCodeMirrorTheme} from './codemirror-theme.js'
import {getSharedStyleSheets} from './shared-styles.js'

const {lineWrapping} = EditorView

const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  grid-area: response;
  max-height: 100%;
  height: 100%;
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 40rem) {
  :host {
    max-height: none;
    min-height: 200px;
    overflow: auto;
  }
}
</style>
<div class="border-left border-top border-top-none-l h-100 gutter-gradient max-h-100 overflow-hidden response-panel-grid">
    <!-- Response Section -->
        <div class="y-scroll min-h-0">
            <div class="pad-b-12">
            <h3 class="config-label mar-t-0 hidden">Response</h3>
            <header class='flex space-between'>
              <dl class='flex items-center margin-0 pad-3 slab-stat'>
                <dt class='nowrap'>Response size</dt>
                <dd id="size" class='nowrap'></dd>
              </dl>
              <dl class='flex items-center margin-0 pad-3 slab-stat'>
                <dt>Time</dt>
                <dd><time id="time" datetime=""></time></dd>
              </dl>
          </header>
          <div id="response" name="response" class="cm-s-dracula"></div>
        </div>
      </div>
</div>
`

class ResponsePanel extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }
  updateResponse = ({result}) => {
    if (!result) return

    const {error, json, timings} = result
    if (!error) {
      const transaction = this.api.store.response.state.update({
        changes: {
          from: 0,
          insert: JSON.stringify(json, null, 2),
          to: this.api.store.response.state.doc.length,
        },
      })
      this.api.store.response.dispatch(transaction)

      this.size.innerText = json ? prettyBytes(JSON.stringify(json).length) : ''

      if (timings && 'bundle' in timings && 'execute' in timings) {
        const bundleTime = prettyMilliseconds(timings.bundle)
        const executeTime = prettyMilliseconds(timings.execute)
        this.time.innerText = `${executeTime} (+${bundleTime} bundle time)`
        this.time.dateTime = `PT${executeTime / 1000}S`
      } else if (timings && 'execute' in timings) {
        this.time.innerText = prettyMilliseconds(timings.execute)
        this.time.dateTime = `PT${timings.execute / 1000}S`
      } else {
        this.time.innerText = ''
        this.time.dateTime = ''
      }
    } else {
      const transaction = this.api.store.response.state.update({
        changes: {from: 0, to: this.api.store.response.state.doc.length, insert: ''},
      })
      this.api.store.response.dispatch(transaction)
      this.size.innerText = ''
      this.time.innerText = ''
      this.time.removeAttribute('datetime')
    }
  }

  async connectedCallback() {
    const sheets = await getSharedStyleSheets()
    this.shadowRoot.adoptedStyleSheets = sheets

    this.response = this.shadowRoot.querySelector('#response')
    this.size = this.shadowRoot.querySelector('#size')
    this.time = this.shadowRoot.querySelector('#time')
    if (this.api) {
      this.api.subscribe(this.updateResponse, ['result'])
      if (this.api.store.result) {
        this.updateResponse({result: this.api.store.result})
      }
    } else {
      console.error('API context not available for response-panel on connect.')
    }

    this.api.store.response = new EditorView({
      doc: '\n\n\n\n',
      extensions: [basicSetup, json(), sanityCodeMirrorTheme, EditorState.readOnly.of(true)],
      parent: this.response,
      lineWrapping,
    })
  }

  disconnectedCallback() {
    if (this.api) {
      this.api.unsubscribe(this.updateResponse)
    }
  }
}

customElements.define('response-panel', ResponsePanel)
