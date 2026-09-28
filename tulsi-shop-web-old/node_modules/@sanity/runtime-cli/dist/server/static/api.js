/* eslint-disable n/no-unsupported-features/node-builtins */
import {Store} from './vendor/vendor.bundle.js'

// list of events to simulate
const events = ['create', 'update', 'delete'].map((e) => ({name: e}))

/** @type {Record<string, unknown>} */
// eslint-disable-next-line new-cap
const store = Store({events, selectedEvent: events[0].name})

export default function API() {
  return {
    blueprint,
    document,
    invoke,
    projects,
    datasets,
    organizations,
    mediaLibraries,
    asset,
    store,
    subscribe: store.subscribe,
    unsubscribe: store.unsubscribe,
  }
}

/**
 * @param {object} params
 * @param {unknown} params.context
 * @param {unknown} params.event
 * @param {unknown} params.metadata
 */
function invoke({context, event, metadata}) {
  store.inprogress = true
  const start = Date.now()
  const payload = {
    data: {context, event},
    func: store.selectedIndex,
    metadata,
  }
  return fetch('/invoke', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then((response) => {
      return response.json().then((data) => ({data, timings: getServerTimings(response)}))
    })
    .then(({data, timings}) => {
      store.inprogress = false
      store.result = {
        ...data,
        time: Date.now() - start,
        timings,
      }
    })
}

function blueprint() {
  return fetch('/blueprint')
    .then((response) => response.json())
    .then((blueprint) => {
      const {parsedBlueprint, projectId, organizationId} = blueprint
      const functions = parsedBlueprint?.resources.filter((r) =>
        r.type.startsWith('sanity.function.'),
      )

      store.functions = functions
      store.selectedIndex = functions[0].name
      store.selectedFunctionType = functions[0].type
      store.defaultProject = projectId || undefined
      store.defaultOrganization = organizationId || undefined
    })
    .catch(() => {
      store.functions = []
    })
}

function projects() {
  return fetch('/projects')
    .then((response) => response.json())
    .then(async (projects) => {
      store.projects = projects.sort((a, b) => {
        const nameA = a.displayName.toUpperCase()
        const nameB = b.displayName.toUpperCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      })
      store.selectedProject = store.defaultProject ? store.defaultProject : projects[0].id
      await datasets(store.selectedProject)
    })
    .catch(() => {
      store.projects = []
    })
}

/**
 * @param {string} selectedProject
 */
function datasets(selectedProject) {
  return fetch(`/datasets?project=${selectedProject}`)
    .then((response) => response.json())
    .then((datasets) => {
      store.datasets = datasets.sort((a, b) => {
        const nameA = a.name.toUpperCase()
        const nameB = b.name.toUpperCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      })
      store.selectedDataset = datasets[0].name
    })
    .catch(() => {
      store.datasets = []
    })
}

/**
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.dataset
 * @param {string} params.docId
 */
function document({projectId, dataset, docId}) {
  return fetch(`/document?project=${projectId}&dataset=${dataset}&doc=${docId}`)
    .then((response) => response.json())
    .then((doc) => {
      store.document = doc
    })
    .catch(() => {
      store.document = {}
    })
}

function organizations() {
  return fetch('/organizations')
    .then((response) => response.json())
    .then(async (organizations) => {
      store.organizations = organizations
      store.selectedOrganization = store.defaultOrganization
        ? store.defaultOrganization
        : organizations[0].id
      await mediaLibraries(store.selectedOrganization)
    })
    .catch(() => {
      store.organizations = []
    })
}

function mediaLibraries(selectedOrganization) {
  return fetch(`/media-libraries?organization=${selectedOrganization}`)
    .then((response) => response.json())
    .then((mediaLibraries) => {
      store.mediaLibraries = mediaLibraries
      store.selectedMediaLibrary = store.defaultMediaLibrary
        ? store.defaultMediaLibrary
        : mediaLibraries[0].id
    })
    .catch(() => {
      store.mediaLibraries = []
    })
}

/**
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.mediaLibraryId
 * @param {string} params.docId
 */
function asset({organizationId, mediaLibraryId, docId}) {
  return fetch(`/asset?organization=${organizationId}&medialibrary=${mediaLibraryId}&doc=${docId}`)
    .then((response) => response.json())
    .then((doc) => {
      store.document = doc
    })
    .catch(() => {
      store.document = {}
    })
}

function getServerTimings(response) {
  const timings = {}
  const serverTiming = response.headers.get('Server-Timing')
  if (!serverTiming) {
    return timings
  }

  for (const entry of serverTiming.split(',')) {
    const [name, ...params] = entry.split(';')
    const durationParam = params.find((p) => p.startsWith('dur='))
    if (durationParam) {
      timings[name.trim()] = Number.parseFloat(durationParam.slice(4))
    }
  }

  return timings
}
