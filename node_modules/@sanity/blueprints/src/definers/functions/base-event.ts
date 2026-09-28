import type {BlueprintFunctionBaseResourceEvent} from '../../index.js'

type BaseFunctionEventKey = keyof BlueprintFunctionBaseResourceEvent
export const BASE_EVENT_KEYS = new Set<BaseFunctionEventKey>(['on', 'filter', 'projection', 'includeDrafts'])
