const firstVersion = '2024-10-01'
const formatProperties = [
  '$schema',
  'blueprintVersion',
  'resources',
  'parameters',
  'values',
  'outputs',
  'metadata',
]
const parameterTypes = ['arg', 'argument', 'env-var', 'envVar', 'stdin', 'config']
const versionFormat = /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
const nameFormat = /^[a-zA-Z][a-zA-Z0-9-_]*(?<![-_])$/
const typeFormat = /^[a-zA-Z]([a-zA-Z0-9-_]+\.?)*(?<![-_.])$/

export {firstVersion, formatProperties, nameFormat, parameterTypes, typeFormat, versionFormat}
