/* globals customElements */
import {ApiBaseElement} from './api-base.js'
import {getSharedStyleSheets} from './shared-styles.js'

const template = document.createElement('template')
template.innerHTML = `
<ol class="hidden-lg pad-t-0 pad-b-0 pad-r-4 pad-l-4" type="content"></ol>
<fieldset class="hidden block-lg pad-t-0 pad-b-0 pad-r-3 pad-l-3 mar-b-3"><select class="dropdown-select"></select></fieldset>
`

class FunctionList extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }

  async connectedCallback() {
    const sheets = await getSharedStyleSheets()

    // Create a component-specific stylesheet that will be applied after shared styles
    const componentSheet = new CSSStyleSheet()
    await componentSheet.replace(`
      select {
        background: transparent !important;
        color: light-dark(var(--gray-950), var(--gray-300)) !important;
      }
    `)

    this.shadowRoot.adoptedStyleSheets = [...sheets, componentSheet]

    this.list = this.shadowRoot.querySelector('ol')
    this.select = this.shadowRoot.querySelector('select')
    this.list.addEventListener('click', this.functionClicked)
    this.select.addEventListener('change', this.functionSelected)
    this.api.subscribe(this.renderFunctions, ['functions', 'selectedIndex'])
    this.api.blueprint()
  }

  functionClicked = (event) => {
    const name = event.target.closest('li').dataset.name
    const target = this.api.store.functions.find((func) => func.name === name)
    this.api.store.selectedIndex = target.name
    this.api.store.selectedFunctionType = target.type
  }
  functionSelected = (event) => {
    this.api.store.selectedIndex = event.target.value
  }
  renderListItem = (func) => {
    const selected = this.api.store.selectedIndex === func.name ? 'selected' : ''
    return `<li data-name="${func.name}" class="function-list-item ${selected} flex flex-col pad-t-4 pad-b-4 pad-r-6 pad-l-6">
<span class="function-list-item-label">${func.name}</span>
<span class="function-list-item-type capitalize">${this.renderType(func.type)}</span>
</li>`
  }
  renderType = (type) => {
    switch (type) {
      case this.SANITY_FUNCTION_DOCUMENT:
        return 'Document'
      case this.SANITY_FUNCTION_MEDIA_LIBRARY_ASSET:
        return 'Media Library'
      case this.SANITY_FUNCTION_SCHEDULED:
        return 'Scheduled'
      default:
        // this works well for sync-tag-invalidate functions!
        return type.split('.').pop().replaceAll('-', ' ')
    }
  }
  renderFunctions = () => {
    if (this.api.store.functions.length > 0) {
      this.list.innerHTML = this.api.store.functions
        .map((func) => {
          return this.renderListItem(func)
        })
        .join('')
      this.select.innerHTML = this.api.store.functions
        .map((func) => {
          const selected = this.api.store.selectedIndex === func.name ? 'selected' : ''
          return `<option value="${func.name}" ${selected}>${func.name}</option>`
        })
        .join('')
    } else {
      this.list.innerHTML = '<option class="pad-2">No Functions found</li>'
      this.select.innerHTML = '<option>No blueprint.json file found</option>'
    }
  }

  disconnectedCallback() {
    this.list.removeEventListener('click', this.functionClicked)
    this.select.removeEventListener('change', this.functionSelected)
    this.api.unsubscribe(this.renderFunctions)
  }
}

customElements.define('function-list', FunctionList)
