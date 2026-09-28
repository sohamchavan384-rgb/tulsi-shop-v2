import {ApiBaseElement} from './api-base.js'

import {getSharedStyleSheets} from './shared-styles.js'

const template = document.createElement('template')
template.innerHTML = `
<fieldset class="mar-t-2">
    <label class="slab-text">
      <span class="block mar-b-1">API Version</span>
      <input name="apiVersion" id="apiversion" class="transparent border-color component-color component-height">
    </label>
</fieldset>
`

class ApiVersionComponent extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }

  async connectedCallback() {
    const sheets = await getSharedStyleSheets()

    // Create a component-specific stylesheet that will be applied after shared styles
    const componentSheet = new CSSStyleSheet()
    await componentSheet.replace(`
      :host {
        align-self: flex-end;
      }
      fieldset {
        margin-top: 0 !important;
      }
      input {
        background: transparent !important;
        color: light-dark(var(--gray-950), var(--gray-300)) !important;
      }
    `)

    this.shadowRoot.adoptedStyleSheets = [...sheets, componentSheet]

    this.input = this.shadowRoot.querySelector('input')
    this.input.addEventListener('input', this.updateApiVersion)
  }

  updateApiVersion = (event) => {
    this.api.store.apiVersion = event.target.value
  }
}

customElements.define('api-version', ApiVersionComponent)
