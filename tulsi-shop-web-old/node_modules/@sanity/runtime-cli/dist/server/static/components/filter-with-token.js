import {getSharedStyleSheets} from './shared-styles.js'

const template = document.createElement('template')
template.innerHTML = `
<fieldset class="mar-t-2 flex flex-col">
    <span class="slab-text block mar-b-1">
        <span class="flex items-center">
        With Token
        <help-button>
            <p><strong>With Token</strong> controls whether your function runs with or without authentication.</p>
            <p><strong>Enabled:</strong> Function executes with your API token, providing full, authenticated access to your Sanity project.</p>
            <p><strong>Disabled:</strong> Function executes without authentication, useful for testing public endpoints or functions that don't require user permissions.</p>
        </help-button>
        </span>
    </span>
    <toggle-switch toggle-key="withToken" class="flex component-height"></toggle-switch>
</fieldset>
`

class WithTokenComponent extends HTMLElement {
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
    `)

    this.shadowRoot.adoptedStyleSheets = [...sheets, componentSheet]
  }
}

customElements.define('with-token', WithTokenComponent)
