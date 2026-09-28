import {ComponentType} from 'react'
import {JSX} from 'react/jsx-runtime'
import {ReactNode} from 'react'
import type {Syntax} from 'refractor'

/**
 * @public
 */
export declare const hasLanguage: (lang: string) => boolean

/**
 * @public
 */
export declare interface Marker {
  line: number
  className?: string
  component?: ReactNode | ComponentType<MarkerProps>
}

/**
 * @public
 */
export declare interface MarkerProps {
  className: string
  markers: (Marker | number)[]
  children?: ReactNode
}

/**
 * @public
 */
export declare function Refractor(props: RefractorProps): JSX.Element

/**
 * @public
 */
export declare interface RefractorProps {
  /**
   * The code value to highlight
   */
  value: string
  /**
   * The language code/name to use for highlighting, eg `php`, `css`, `html` etc
   */
  language: string
  /**
   * Class name for the outer `<pre>` element, defaults to `refractor`
   * Note: this is not used when `inline` is `true`.
   */
  className?: string
  /**
   * If `true`, the code will not be highlighted - instead it will be rendered as plain text.
   */
  plainText?: boolean
  /**
   * If `true`, the code will be rendered inline, eg not wrapped in a `<pre>` element.
   */
  inline?: boolean
  /**
   * An array of markers to highlight in the code.
   */
  markers?: (Marker | number)[]
}

/**
 * @public
 */
export declare const registerLanguage: (lang: Syntax) => undefined

export {}
