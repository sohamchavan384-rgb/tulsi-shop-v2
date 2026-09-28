export default {
  min: {},

  // resources
  minResources: {
    resources: [],
  },
  minResourcesWithResource: {
    resources: [
      {
        name: 'a-resource',
        type: 'a-type',
      },
    ],
  },

  // values
  minValues: {
    values: {},
  },
  minValuesWithValue: {
    values: {hello: 'there'},
  },

  // parameters
  minParameters: {
    parameters: [],
  },
  minParametersWithParameter: {
    parameters: [
      {
        name: 'a-param',
        type: 'stdin',
      },
    ],
  },

  // outputs
  minOutputs: {
    outputs: [],
  },
  minOutputsWithOutput: {
    outputs: [
      {
        name: 'an-output',
        value: true,
      },
    ],
  },

  // metadata
  minMetadata: {
    metadata: {},
  },
  minMetadataWithMetadata: {
    metadata: {ok: true},
  },
}
