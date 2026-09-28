/* globals customElements document window */
import {ApiBaseElement} from './api-base.js'
import {getSharedStyleSheets} from './shared-styles.js'

// Template for the console panel
const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
  grid-area: console;
  overflow: hidden;
}

@media (max-width: 40rem) {
  :host {
    max-height: 400px;
    min-height: 200px;
    overflow: auto;
  }
}
</style>
<div id="console-container" class="relative y-scroll h-100 max-h-100 bg-base pad-t-0 pad-r-3 pad-b-7 pad-l-5 border-top">
  <div class="sticky top-0 left-0 right-0 mar-t-0 mar-b-0">
    <h3 class="config-label mar-t-0 mar-b-0 pad-t-3 bg-base z-32">
      Console
    </h3>
    <div class="bg-base flex items-center pad-0 pad-b-2 flex-end">
      <toggle-switch toggle-key="preserveLog">
        <span class="slab-text mar-l-1">Preserve Log</span>
      </toggle-switch>
      <clear-button></clear-button>
    </div>
  </div>
  <pre id="console-output" class="pad-0 mar-t-0 mar-r-0 mar-b-5 mar-l-0 pre-wrap break-word"></pre>
</div>
`

class ConsolePanel extends ApiBaseElement {
  /**
   * Nested context.invoke() output for the current run, kept as a list so the
   * final render can order it by call order. Nested runs finish innermost-first
   * (A → B → C resolves C then B), so each carries an `order` stamped when it was
   * initiated; the final render sorts by it. Buffered separately so it survives
   * the result render, which would otherwise overwrite the console when Preserve
   * Log is off.
   */
  nestedEntries = []

  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }
  updateConsole = ({result}) => {
    // Guard against element not being ready or API not injected yet
    if (!this.consoleOutput || !result) return

    const {error, logs} = result
    // Always show the logs. Then append the error, rather than replacing the logs with it.
    let update = logs ?? ''
    if (error) {
      const errText = (error.stack || error.message || error.name) ?? 'An error occurred.'
      update = update.trim() ? `${update.trimEnd()}\n${errText}` : errText
    }

    if (this.api.store.preserveLog) {
      // Nested output was already appended live during the run; keep it in place.
      this.consoleOutput.innerText = this.consoleOutput.innerText + update
    } else {
      // Re-render so the nested output is shown in call order rather than the
      // completion order it streamed in (and so it survives this overwrite).
      this.consoleOutput.innerText = update + this.renderNestedEntries()
    }
  }

  // Join the nested runs in call order (the order they were initiated).
  renderNestedEntries = () =>
    [...this.nestedEntries]
      .sort((a, b) => a.order - b.order)
      .map((e) => e.text)
      .join('')

  updateNested = (event) => {
    const nestedInvoke = event.detail
    if (!this.consoleOutput || !nestedInvoke) return

    const {name, order, logs, json, error} = nestedInvoke
    // Always show the logs. Then append the error, rather than replacing the logs with it.
    let body = logs ?? ''
    if (error) {
      const errText = (error.stack || error.message || error.name) ?? 'An error occurred.'
      body = body.trim() ? `${body.trimEnd()}\n${errText}` : errText
    } else if (typeof json !== 'undefined') {
      body += `${body && !body.endsWith('\n') ? '\n' : ''}→ returned ${JSON.stringify(json)}\n`
    }

    const text = `↳ BEGIN: invoke('${name}')\n${body.trim()}\n↳ END: invoke('${name}')\n`
    this.nestedEntries.push({order, text})
    // Append live for immediate feedback; the final result render reorders.
    this.consoleOutput.innerText = this.consoleOutput.innerText + text
  }

  // A new invocation is starting; drop the previous run's nested output.
  resetNested = ({inprogress}) => {
    if (inprogress) this.nestedEntries = []
  }

  clear = () => {
    const backUp = this.api.store.preserveLog
    this.api.store.result = {logs: undefined, error: undefined}
    this.nestedEntries = []
    this.consoleOutput.innerText = ''
    this.api.store.preserveLog = backUp
  }

  async connectedCallback() {
    const sheets = await getSharedStyleSheets()
    this.shadowRoot.adoptedStyleSheets = sheets

    this.consoleOutput = this.shadowRoot.querySelector('#console-output')
    this.addEventListener('clear-console', this.clear)

    // Nested context.invoke() runs arrive as a stream of discrete DOM events
    // (not state) so none are dropped when several land in one frame.
    window.addEventListener('nested-invoke', this.updateNested)

    // Subscribe to changes in the result state to update the console
    if (this.api) {
      this.api.subscribe(this.updateConsole, ['result'])
      this.api.subscribe(this.resetNested, ['inprogress'])
      // Initial update in case result is already populated
      if (this.api.store.result) {
        this.updateConsole({result: this.api.store.result})
      }
    } else {
      console.error('API context not available for console-panel on connect.')
      // Optionally, set up a mechanism to wait for API initialization if needed
    }
  }

  disconnectedCallback() {
    this.removeEventListener('clear-console', this.clear)
    window.removeEventListener('nested-invoke', this.updateNested)
    // Unsubscribe when the element is removed from the DOM
    if (this.api) {
      this.api.unsubscribe(this.updateConsole)
      this.api.unsubscribe(this.resetNested)
    }
  }
}

// Define the new custom element
customElements.define('console-panel', ConsolePanel)
