/* globals customElements document */
import {ApiBaseElement} from './api-base.js'

const template = document.createElement('template')
template.innerHTML = `
<style>
button {
  anchor-name: --button;
  background-color: transparent;
  border-color: transparent;
  display: flex;
  align-items: center;
}
div[popover] {
  position-anchor: --button;
  max-width: 15rem;
  left: anchor(left);
  top: anchor(bottom);
  display: block;
  margin: 0;
  opacity: 0;
  transform: scale(0.95);
  transform-origin: top left;
  visibility: hidden;
  transition:
    opacity 500ms,
    transform 500ms,
    visibility 500ms;
  border-width: var(--gutter-border-width);
  border-color: light-dark(var(--gray-200), var(--gray-800));
  border-radius: 0.375rem;
}

[popover]:popover-open {
  transform: scale(1);
  opacity: 1;
  visibility: visible;
}
.help-button-padding {
  padding: 0.75rem;
}
</style>
<button title="Info" popovertarget="popover-el">
    <svg data-sanity-icon="help-circle" width="1em" height="1em" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 13C12.5 11 14 11.5 14 10C14 9.34375 13.5 8.5 12.5 8.5C11.5 8.5 11 9 10.5 9.5M12.5 16V14.5M20.5 12.5C20.5 16.9183 16.9183 20.5 12.5 20.5C8.08172 20.5 4.5 16.9183 4.5 12.5C4.5 8.08172 8.08172 4.5 12.5 4.5C16.9183 4.5 20.5 8.08172 20.5 12.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"></path></svg>
</button>
<div popover="" id="popover-el">
  <div class="help-button-padding">
    <slot>
    </slot>
  </div>
</div>
`

export class HelpButton extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }
}

customElements.define('help-button', HelpButton)
