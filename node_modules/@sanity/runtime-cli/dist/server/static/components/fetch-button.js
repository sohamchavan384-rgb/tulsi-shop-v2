/* globals customElements document */
import {ApiBaseElement} from './api-base.js'

const template = document.createElement('template')
template.innerHTML = `
<style>
button {
  height: 2.5rem;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  border: 1px solid light-dark(var(--gray-200), var(--gray-800));
  color: var(--text-color);
}

button:hover {
  color: light-dark(var(--gray-950), var(--gray-200));
  background-color: light-dark(var(--gray-50), var(--gray-900));
}

button svg {
  width: 1.25rem;
  height: 1.25rem;
  display: block;
}

</style>
<button aria-label="Fetch Document" title="Fetch Document" type="button">
  <svg width="800px" height="800px" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(4 2)">
      <path d="m4.5 1.5h-2.00245461c-1.1045695 0-2 .8954305-2 2v10c0 1.1045695.8954305 2 2 2h8.00000001c1.1043778-.000491 1.9997288-.8956223 2.0004909-2l.0019637-8-4-4"/>
      <path d="m9.5 8.586-3 2.914-3-2.914"/>
      <path d="m6.5.5v11"/>
    </g>
  </svg>
</button>
`

export class FetchButton extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    this.button = this.shadowRoot.querySelector('button')
    this.addEventListener('click', this.fetchDoc)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.fetchDoc)
  }

  fetchDoc = async () => {
    const docId = this.api.store.docId.trim()

    if (docId) {
      const originalContent = this.button.innerHTML
      this.button.innerHTML = '<network-spinner></network-spinner>'

      try {
        // TODO: This assumes only two functions types for the sake of releasing today
        if (this.api.store.selectedFunctionType === this.SANITY_FUNCTION_DOCUMENT) {
          await this.api.document({
            projectId: this.api.store.selectedProject,
            dataset: this.api.store.selectedDataset,
            docId,
          })
        } else {
          await this.api.asset({
            organizationId: this.api.store.selectedOrganization,
            mediaLibraryId: this.api.store.selectedMediaLibrary,
            docId,
          })
        }
      } catch (err) {
        console.error('Error fetching document:', err)
      } finally {
        this.button.innerHTML = originalContent
      }
    }
  }
}

customElements.define('fetch-button', FetchButton)
