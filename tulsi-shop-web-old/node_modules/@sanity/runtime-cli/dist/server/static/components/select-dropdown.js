/* globals customElements */
import {ApiBaseElement} from './api-base.js'
import {getSharedStyleSheets} from './shared-styles.js'

const template = document.createElement('template')
template.innerHTML = `
<fieldset class="mar-t-2">
  <label class="slab-text">
    <span class="block mar-b-1"><slot name="label"></slot></span>
    <div data-ui="Select" class="relative inline-block w-100">
      <select
        data-ui="Select"
        class="w-100 appearance-none transparent component-color dropdown-template"
      ></select>
      <div
        data-as="div"
        data-ui="Box"
        class="flex items-center h-100 dropdown-template-div"
      >
        <svg
          data-sanity-icon="chevron-down"
          width="1.5rem"
          height="1.5rem"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 10L12.5 14.5L8 10"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          ></path>
        </svg>
      </div>
    </div>
  </label>
</fieldset>
`

class SelectDropdown extends ApiBaseElement {
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
      select {
        background: transparent !important;
        color: light-dark(var(--gray-950), var(--gray-300)) !important;
      }
    `)

    this.shadowRoot.adoptedStyleSheets = [...sheets, componentSheet]

    this.label = this.getAttribute('label') || 'Select'
    this.storeKey = this.getAttribute('store-key')
    this.selectedKey = this.getAttribute('selected-key')
    this.valueProp = this.getAttribute('value-prop') || 'id'
    this.labelProp = this.getAttribute('label-prop') || 'displayName'
    this.subscribeTo = this.getAttribute('subscribe-to')

    // Set label text in slot
    const labelSlot = this.shadowRoot.querySelector('slot[name="label"]')
    labelSlot.textContent = this.label

    this.select = this.shadowRoot.querySelector('select')
    this.select.addEventListener('change', this.handleSelect)

    this.api.subscribe(this.renderOptions, [this.storeKey])

    if (this.hasAttribute('trigger-fetch')) {
      // e.g. this.api.projects()
      this.api[this.storeKey]?.()
    } else if (this.subscribeTo) {
      this.api.subscribe(this.refreshOnChange, [this.subscribeTo])
    } else {
      this.renderOptions()
    }
  }

  disconnectedCallback() {
    this.select.removeEventListener('change', this.handleSelect)
    this.api.unsubscribe(this.renderOptions)
    if (this.subscribeTo) {
      this.api.unsubscribe(this.refreshOnChange)
    }
  }

  handleSelect = (event) => {
    this.api.store[this.selectedKey] = event.target.value
  }

  renderOptions = () => {
    const items = this.api.store?.[this.storeKey] || []
    const selectedVal = this.api.store?.[this.selectedKey]
    if (items.length === 0) {
      this.select.innerHTML = `<option>No ${this.label}s found</option>`
      return
    }
    this.select.innerHTML = items
      .map((item) => {
        const val = item[this.valueProp]
        const label = item[this.labelProp] ?? val
        const selected = selectedVal === val ? 'selected' : ''
        return `<option value="${val}" ${selected}>${label}</option>`
      })
      .join('')
  }

  refreshOnChange = () => {
    this.api[this.storeKey]?.(this.api.store[this.subscribeTo])
  }
}

customElements.define('select-dropdown', SelectDropdown)
