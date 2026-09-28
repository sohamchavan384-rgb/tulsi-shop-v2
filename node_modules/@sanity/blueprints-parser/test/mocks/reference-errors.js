export default {
  missingParameterReference: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.parameters.memory'},
        },
      ],
      parameters: [
        {
          name: 'memory',
          type: 'env-var',
          input: 'MEM',
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.parameters.memory'},
        },
      ],
      parameters: [
        {
          name: 'memory',
          type: 'env-var',
          input: 'MEM',
        },
      ],
    },
    error: {
      type: 'missing_parameter',
      message: "Reference error '$.parameters.memory': 'memory' not found in passed parameters",
    },
  },

  missingResourceReference: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.resources.another-function.memory'},
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.resources.another-function.memory'},
        },
      ],
    },
    error: {
      type: 'missing_resource',
      message:
        "Reference error '$.resources.another-function.memory': 'another-function' not found in blueprint resources",
    },
  },

  missingValueReference: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.values.memory'},
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.values.memory'},
        },
      ],
    },
    error: {
      type: 'missing_value',
      message: "Reference error '$.values.memory': 'memory' not found in blueprint values",
    },
  },

  invalidReferenceTypeMetadata: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.metadata.memory'},
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.metadata.memory'},
        },
      ],
    },
    error: {
      type: 'invalid_reference',
      message: "Reference error '$.metadata.memory': invalid reference to metadata",
    },
  },

  invalidReferenceType: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.invalid.memory'},
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {memory: '$.invalid.memory'},
        },
      ],
    },
    error: {
      type: 'invalid_reference',
      message: "Reference error '$.invalid.memory': invalid reference type invalid",
    },
  },

  invalidReferenceResourceType: {
    options: {
      invalidReferenceTypes: ['cloud-function'],
    },
    input: {
      resources: [
        {
          name: 'a-function-1',
          type: 'cloud-function',
          config: {memory: 1000},
        },
        {
          name: 'a-function-2',
          type: 'cloud-function',
          config: {memory: '$.resources.a-function-1.config.memory'},
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function-1',
          type: 'cloud-function',
          config: {memory: 1000},
        },
        {
          name: 'a-function-2',
          type: 'cloud-function',
          config: {memory: '$.resources.a-function-1.config.memory'},
        },
      ],
    },
    error: {
      type: 'invalid_reference',
      message:
        "Reference error '$.resources.a-function-1.config.memory': 'a-function-1' type 'cloud-function' cannot be referenced",
    },
  },

  unresolvedParameterReferenceAndRegularReference: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {
            memory: '$.parameters.memory',
            disk: '20G',
          },
        },
        {
          name: 'another-function',
          type: 'cloud-function',
          config: {
            disk: '$.resources.a-function.config.disk',
          },
        },
      ],
      parameters: [
        {
          name: 'memory',
          type: 'env-var',
          input: 'MEM',
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {
            memory: '$.parameters.memory',
            disk: '20G',
          },
        },
        {
          name: 'another-function',
          type: 'cloud-function',
          config: {
            disk: '$.resources.a-function.config.disk',
          },
        },
      ],
      parameters: [
        {
          name: 'memory',
          type: 'env-var',
          input: 'MEM',
        },
      ],
    },
    unresolved: [
      {
        path: 'resources.another-function.config.disk',
        ref: '$.resources.a-function.config.disk',
        source: {collection: 'resources', name: 'a-function', path: 'config.disk'},
        target: {collection: 'resources', name: 'another-function', path: 'config.disk'},
      },
    ],
    error: {
      type: 'missing_parameter',
      message: "Reference error '$.parameters.memory': 'memory' not found in passed parameters",
    },
  },

  // collection-only reference has no name to resolve
  repeatedCollectionOnlyReference: {
    input: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {
            first: '$.resources',
            second: '$.resources',
          },
        },
      ],
    },
    expected: {
      resources: [
        {
          name: 'a-function',
          type: 'cloud-function',
          config: {
            first: '$.resources',
            second: '$.resources',
          },
        },
      ],
    },
    unresolved: [
      {
        path: 'resources.a-function.config.second',
        ref: '$.resources',
        source: {collection: 'resources', name: '', path: ''},
        target: {collection: 'resources', name: 'a-function', path: 'config.second'},
      },
    ],
    error: {
      type: 'missing_resource',
      message: "Reference error '$.resources': 'undefined' not found in blueprint resources",
    },
  },
}
