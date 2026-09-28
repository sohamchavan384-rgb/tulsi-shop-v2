/* globals customElements document */
import {ApiBaseElement} from './api-base.js'

const template = document.createElement('template')
template.innerHTML = `
<style>
button {
  background-color: transparent;
  border-color: transparent;
  margin-left: var(--m-space-1);
  display: flex;
  align-items: center;
  cursor: pointer;
}
button svg {
  fill: var(--text-color);
}
</style>
<button title="Clear Log">
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zM2.5 12A9.5 9.5 0 0112 2.5c2.353 0 4.507.856 6.166 2.273L4.773 18.166A9.462 9.462 0 012.5 12zm3.334 7.227A9.462 9.462 0 0012 21.5a9.5 9.5 0 009.5-9.5 9.462 9.462 0 00-2.273-6.166L5.834 19.227z"/></svg>
</button>
`

export class ClearButton extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    this.addEventListener('click', this.clear)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.clear)
  }

  clear = () => {
    this.dispatchEvent(
      new CustomEvent('clear-console', {
        bubbles: true,
        composed: true,
      }),
    )
  }
}

customElements.define('clear-button', ClearButton)
