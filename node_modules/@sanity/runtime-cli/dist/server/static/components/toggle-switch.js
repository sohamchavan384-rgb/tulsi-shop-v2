/* globals customElements document */
import {ApiBaseElement} from './api-base.js'

const template = document.createElement('template')
template.innerHTML = `
  <style>
  :host {
    display: inline-block;
    cursor: pointer;
  }

  .switch-container {
    display: flex;
    align-items: center;
  }

  [part="track"] {
    padding: 0.125em;
    border-radius: 1em;
    background-color: hsl(0, 0%, 67%);
    width: 1.5rem;
    height: 0.75rem;
    text-align: left;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }

  [part="slider"] {
    border-radius: 1em;
    background-color: hsl(0, 0%, 100%);
    box-shadow: 0.0625em 0.0625em 0.125em hsla(0, 0%, 0%, 0.25);
    width: 50%;
    height: 100%;
    transition: all 256ms;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 10px;
  }

  :host([checked]) [part="slider"] {
    transform: translateX(100%);
  }

  :host([checked])::part(track) {
    background-color: var(--color-interactive-primary-active-bg);
  }
</style>


  <div class="switch-container">
    <span part="track">
      <span part="slider"></span>
    </span>
    <slot></slot>
  </div>
`

export class ToggleSwitch extends ApiBaseElement {
  static get observedAttributes() {
    return ['checked']
  }

  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    this.setAttribute('role', 'switch')
    this.setAttribute('tabindex', '0')
    this.toggleKey = this.getAttribute('toggle-key')
    this.addEventListener('click', this.toggle)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.toggle)
  }

  attributeChangedCallback(name) {
    if (name === 'checked') {
      this.setAttribute('aria-checked', this.checked.toString())
    }
  }

  get checked() {
    return this.hasAttribute('checked')
  }
  set checked(value) {
    this.toggleAttribute('checked', value)
  }

  toggle = () => {
    this.checked = !this.checked
    this.api.store[this.toggleKey] = this.checked
  }
}

customElements.define('toggle-switch', ToggleSwitch)
