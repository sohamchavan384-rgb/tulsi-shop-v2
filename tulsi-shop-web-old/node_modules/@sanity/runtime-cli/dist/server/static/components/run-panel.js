/* globals customElements document */
import {ApiBaseElement} from './api-base.js'
import {getSharedStyleSheets} from './shared-styles.js'

const runTemplate = `<svg data-sanity-icon="play" width="1em" height="1em" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 18.5V6.5L17.5 12.5L7.5 18.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"></path></svg>
<span title="Type CTRL + Enter to Run">Run</span>`

const template = document.createElement('template')
template.innerHTML = `<div class="pad-3">
    <button ord="primary" class="items-center sanity-button">
        <span class="flex pad-3 gap-25 justify-content-center flex-row">
            ${runTemplate}
        </span>
    </button>
</div>
`

class RunPanel extends ApiBaseElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true))
  }
  invoke = () => {
    const selectedEvent = this.api.store.selectedEvent
    const docFunction = this.api.store.selectedFunctionType === this.SANITY_FUNCTION_DOCUMENT
    const mediaFunction =
      this.api.store.selectedFunctionType === this.SANITY_FUNCTION_MEDIA_LIBRARY_ASSET
    const scheduleFunction = this.api.store.selectedFunctionType === this.SANITY_FUNCTION_SCHEDULED
    const docOrScheduleFunction = docFunction || scheduleFunction

    this.api.store.result = {logs: '', time: 0}
    let event = {}
    let before = null
    let after = null
    if (selectedEvent === 'update') {
      const beforePayloadText = this.createPayloadText(this.api.store.beforePayload.state.doc)
      before = JSON.parse(beforePayloadText)

      const afterPayloadText = this.createPayloadText(this.api.store.afterPayload.state.doc)
      after = JSON.parse(afterPayloadText)

      event = after
    } else {
      const payloadText = this.createPayloadText(this.api.store.payload.state.doc)
      event = JSON.parse(payloadText)

      if (selectedEvent === 'create') {
        after = event
      } else if (selectedEvent === 'delete') {
        before = event
      }
    }
    const context = {
      clientOptions: {
        apiVersion: this.api.store.apiVersion,
        dataset: this.api.store.selectedDataset,
        projectId: this.api.store.selectedProject,
        token: this.api.store.withToken,
      },
      eventResourceType: scheduleFunction
        ? 'scheduled'
        : mediaFunction
          ? 'media-library'
          : 'dataset',
      eventResourceId: docOrScheduleFunction
        ? `${this.api.store.selectedProject}.${this.api.store.selectedDataset}`
        : this.api.store.selectedMediaLibrary,
      functionResourceType: docOrScheduleFunction ? 'project' : 'organization',
      functionResourceId: docOrScheduleFunction
        ? this.api.store.selectedProject
        : this.api.store.selectedOrganization,
    }
    const metadata = {
      event: selectedEvent,
      before,
      after,
    }
    this.api.invoke({context, event, metadata})
  }
  createPayloadText = (doc) => {
    if (doc) {
      const payload = doc.toString().trim()
      return payload ? payload : '{}'
    }
    return '{}'
  }
  updateButtonText = ({inprogress}) => {
    if (inprogress) {
      this.button.setAttribute('disabled', '')
      this.buttonText.innerHTML = '<network-spinner></network-spinner>'
    } else {
      this.button.removeAttribute('disabled')
      this.buttonText.innerHTML = runTemplate
    }
  }
  onKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      this.invoke()
    }
  }

  async connectedCallback() {
    const sheets = await getSharedStyleSheets()
    this.shadowRoot.adoptedStyleSheets = sheets

    this.button = this.shadowRoot.querySelector('button')
    this.buttonText = this.button.querySelector('span')
    this.button.addEventListener('click', this.invoke)
    document.addEventListener('keydown', this.onKeyDown)
    this.api.subscribe(this.updateButtonText, ['inprogress'])
  }

  disconnectedCallback() {
    this.button.removeEventListener('click', this.invoke)
    document.removeEventListener('keydown', this.onKeyDown)
  }
}

customElements.define('run-panel', RunPanel)
