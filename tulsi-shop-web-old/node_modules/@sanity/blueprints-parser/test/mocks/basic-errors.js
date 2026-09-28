const ignoreJSONSchemaTest = {metadata: {ignore: true}}

/**
 * @type {Record<string, any>}
 */
export default {
  // blueprintVersion
  blueprintVersionType: {
    blueprintVersion: true,
  },
  blueprintVersionNonDate: {
    blueprintVersion: 'meh',
  },
  blueprintVersionInvalidYear: {
    blueprintVersion: '2000-01-01',
    ...ignoreJSONSchemaTest,
  },
  blueprintVersionInvalidMonth: {
    blueprintVersion: '2024-13-01',
    ...ignoreJSONSchemaTest,
  },
  blueprintVersionInvalidDay: {
    blueprintVersion: '2024-10-33',
    ...ignoreJSONSchemaTest,
  },

  // resources
  resourcesType: {
    resources: {},
  },
  resourcesResourceType: {
    resources: ['hi'],
  },
  resourcesMissingName: {
    resources: [
      {
        type: 'a-type',
      },
    ],
  },
  resourcesMissingType: {
    resources: [
      {
        name: 'a-resource',
      },
    ],
  },
  resourcesInvalidName: {
    resources: [
      {
        name: 123,
        type: 'a-type',
      },
    ],
  },
  resourcesInvalidNameFormat: {
    resources: [
      {
        name: '@-resource',
        type: 'a-type',
      },
    ],
  },
  resourcesInvalidNameFormatTrailingNonAlphanumeric: {
    resources: [
      {
        name: 'a-resource-',
        type: 'a-type',
      },
    ],
  },
  resourcesInvalidType: {
    resources: [
      {
        name: 'a-resource',
        type: true,
      },
    ],
  },
  resourcesInvalidTypeFormat: {
    resources: [
      {
        name: 'a-resource',
        type: '@-type',
      },
    ],
  },
  resourcesInvalidTypeFormatTrailingNonAlphanumeric: {
    resources: [
      {
        name: 'a-resource',
        type: 'a-type-',
      },
    ],
  },
  resourcesInvalidTypeFormatTrailingPeriod: {
    resources: [
      {
        name: 'a-resource',
        type: 'a.type.',
      },
    ],
  },
  resourcesDuplicateName: {
    resources: [
      {
        name: 'a-resource',
        type: 'a-type',
      },
      {
        name: 'a-resource',
        type: 'a-type',
      },
    ],
    ...ignoreJSONSchemaTest,
  },

  // values
  valuesType: {
    values: 'hi',
  },
  valuesNonScalar: {
    values: {anObject: {}},
  },
  valuesReference: {
    values: {aRef: '$.values.yo'},
    ...ignoreJSONSchemaTest,
  },

  // parameters
  parametersType: {
    parameters: {},
  },
  parametersParameterType: {
    parameters: ['hi'],
  },
  parametersMissingName: {
    parameters: [
      {
        type: 'stdin',
      },
    ],
  },
  parametersMissingType: {
    parameters: [
      {
        name: 'a-param',
      },
    ],
  },
  parametersInvalidName: {
    parameters: [
      {
        name: 123,
        type: 'stdin',
      },
    ],
  },
  parametersInvalidNameFormat: {
    parameters: [
      {
        name: '@-parameter',
        type: 'stdin',
      },
    ],
  },
  parametersInvalidNameFormatTrailingNonAlphanumeric: {
    parameters: [
      {
        name: 'a-parameter-',
        type: 'stdin',
      },
    ],
  },
  parametersInvalidType: {
    parameters: [
      {
        name: 'a-param',
        type: true,
      },
    ],
  },
  parametersInvalidTypeString: {
    parameters: [
      {
        name: 'a-param',
        type: 'idklol',
      },
    ],
  },
  parametersDuplicateName: {
    parameters: [
      {
        name: 'a-param',
        type: 'stdin',
      },
      {
        name: 'a-param',
        type: 'stdin',
      },
    ],
    ...ignoreJSONSchemaTest,
  },

  // outputs
  outputsType: {
    outputs: {},
  },
  outputsParameterType: {
    outputs: ['hi'],
  },
  outputsMissingName: {
    outputs: [
      {
        value: 'a-value',
      },
    ],
  },
  outputsMissingValue: {
    outputs: [
      {
        name: 'an-output',
      },
    ],
  },
  outputsInvalidName: {
    outputs: [
      {
        name: 123,
        value: 'a-value',
      },
    ],
  },
  outputsInvalidNameFormat: {
    outputs: [
      {
        name: '@n-output',
        value: 'a-value',
      },
    ],
  },
  outputsInvalidNameFormatTrailingNonAlphanumeric: {
    outputs: [
      {
        name: 'an-output-',
        type: 'a-value',
      },
    ],
  },
  outputsDuplicateName: {
    outputs: [
      {
        name: 'an-output',
        value: 'a-value',
      },
      {
        name: 'an-output',
        value: 'a-value',
      },
    ],
    ...ignoreJSONSchemaTest,
  },

  // metadata
  metadataType: {
    metadata: false,
  },

  // else
  unknownProperty: {
    idklol: [],
  },
  knownAndUnknownProperty: {
    resources: [],
    idklol: [],
  },
}
