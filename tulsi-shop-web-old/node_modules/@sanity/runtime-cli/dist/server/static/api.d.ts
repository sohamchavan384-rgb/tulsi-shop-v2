export type SubscribeFunc = (fn: () => void) => void

export interface ServerAPI {
  blueprint(): Promise<void>
  document({
    projectId,
    dataset,
    docId,
  }: {
    projectId: string
    dataset: string
    docId: string
  }): Promise<void>
  invoke({
    context,
    event,
    metadata,
  }: {
    context: unknown
    event: unknown
    metadata: unknown
  }): Promise<void>
  projects(): Promise<void>
  datasets(selectedProject: string): Promise<void>
  organizations(): Promise<void>
  mediaLibraries(selectedOrganization: string): Promise<void>
  asset({
    organizationId,
    mediaLibraryId,
    docId,
  }: {
    organizationId: string
    mediaLibraryId: string
    docId: string
  }): Promise<void>
  store: Record<string, unknown> & {subscribe: SubscribeFunc; unsubscribe: SubscribeFunc}
  subscribe: SubscribeFunc
  unsubscribe: SubscribeFunc
}

export default function API(): ServerAPI
