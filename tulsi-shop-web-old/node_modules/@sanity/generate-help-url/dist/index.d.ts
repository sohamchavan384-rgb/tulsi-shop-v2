declare const BASE_URL = 'https://www.sanity.io/docs/help/'

export declare function generateHelpUrl<const Slug extends string>(
  slug: Slug,
): `${typeof BASE_URL}${Slug}`

export {}
