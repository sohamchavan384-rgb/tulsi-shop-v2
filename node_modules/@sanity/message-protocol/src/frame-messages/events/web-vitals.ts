import type {Message} from '@sanity/comlink'

/**
 * Message sent from the embedded app when its Largest Contentful Paint fires.
 * @public
 */
export interface WebVitalsLCPMessage extends Message {
  type: 'dashboard/v1/web-vitals/lcp'
  data: {
    /** LCP value in milliseconds */
    value: number
  }
}

/**
 * Message sent from the embedded app when its First Contentful Paint fires.
 * @public
 */
export interface WebVitalsFCPMessage extends Message {
  type: 'dashboard/v1/web-vitals/fcp'
  data: {
    /** FCP value in milliseconds */
    value: number
  }
}

/**
 * Message sent from the embedded app when its First Input Delay fires.
 * @public
 */
export interface WebVitalsFIDMessage extends Message {
  type: 'dashboard/v1/web-vitals/fid'
  data: {
    /** FID value in milliseconds */
    value: number
  }
}

/**
 * @public
 */
export type WebVitalsMessage = WebVitalsLCPMessage | WebVitalsFCPMessage | WebVitalsFIDMessage
