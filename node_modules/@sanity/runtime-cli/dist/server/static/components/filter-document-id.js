import {ApiBaseElement} from './api-base.js'

import {getSharedStyleSheets} from './shared-styles.js'

const template = document.createElement('template')
template.innerHTML = `
<fieldset class="mar-t-2">
    <label class="slab-text">
      <span class="block mar-b-1">
        <span class="flex items-center">
          Document ID
          <help-button>
            <p>Fill out "Document ID" text field and then click the "Fetch Document" button to pre-populate the Document panel.</p>
            <p>The Document panel is an editable text field so you can edit the fetched document or replace it with any JSON data you want.</p>
            <p>When you click the "Run" button the contents of the Document panel will be evaluated against your filter/projection and sent to your function as the event part of the payload.</p>
          </help-button>
        </span>
      </span>
      <div class="flex flex-direction-row gap-2">
        <input name="docid" id="docid" class="transparent component-color border-color component-height">
        <fetch-button></fetch-button>
      </div>
    </label>
</fieldset>
`

class DocumentIdFilter extends ApiBaseElement {
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
    this.input.addEventListener('input', this.updateDocId)
  }

  updateDocId = (event) => {
    this.api.store.docId = event.target.value
  }
}

customElements.define('document-id', DocumentIdFilter)
