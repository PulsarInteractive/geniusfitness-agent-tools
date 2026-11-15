// Generated from the public TypeSpec reviewed-catalogue import DTOs. Do not edit by hand.
export default {
  "Query": {
    "additionalProperties": false,
    "properties": {
      "catalogueKey": {
        "maxLength": 60,
        "pattern": "^ex\\.[0-9]+$",
        "type": "string"
      },
      "locale": {
        "enum": [
          "fr",
          "en"
        ],
        "type": "string"
      }
    },
    "required": [
      "catalogueKey",
      "locale"
    ],
    "type": "object"
  },
  "Preview": {
    "additionalProperties": false,
    "properties": {
      "catalogueKey": {
        "maxLength": 60,
        "pattern": "^ex\\.[0-9]+$",
        "type": "string"
      },
      "definition": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "catalogKey": {
                "maxLength": 60,
                "pattern": "^ex\\.[0-9]+$",
                "type": "string"
              },
              "countingConvention": {
                "enum": [
                  "alternating_opposite_pair_repetitions",
                  "alternating_side_repetitions",
                  "per_side_repetitions",
                  "per_side_duration",
                  "bilateral_repetitions"
                ],
                "type": "string"
              },
              "defaultUnit": {
                "enum": [
                  "kg",
                  "none"
                ],
                "type": "string"
              },
              "description": {
                "anyOf": [
                  {
                    "maxLength": 4000,
                    "minLength": 1,
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "exerciseType": {
                "enum": [
                  "WeightReps",
                  "BodyweightReps",
                  "WeightedBodyweight",
                  "AssistedBodyweight",
                  "Duration",
                  "DurationWeight",
                  "DistanceDuration",
                  "WeightDistance"
                ],
                "type": "string"
              },
              "kind": {
                "enum": [
                  "Exercise"
                ],
                "type": "string"
              },
              "movementIntent": {
                "anyOf": [
                  {
                    "maxLength": 280,
                    "minLength": 1,
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "name": {
                "maxLength": 100,
                "minLength": 2,
                "type": "string"
              }
            },
            "required": [
              "catalogKey",
              "defaultUnit",
              "exerciseType",
              "kind",
              "name"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "mappingVersion": {
        "maxLength": 64,
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      },
      "origin": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "catalogueKey": {
                "maxLength": 60,
                "pattern": "^ex\\.[0-9]+$",
                "type": "string"
              },
              "countingConvention": {
                "enum": [
                  "alternating_opposite_pair_repetitions",
                  "alternating_side_repetitions",
                  "per_side_repetitions",
                  "per_side_duration",
                  "bilateral_repetitions"
                ],
                "type": "string"
              },
              "coverage": {
                "enum": [
                  "partial"
                ],
                "type": "string"
              },
              "loadConvention": {
                "enum": [
                  "total",
                  "perImplement",
                  "perSide",
                  "bodyweight",
                  "unknown"
                ],
                "type": "string"
              },
              "mappingVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "qualification": {
                "enum": [
                  "reviewed_subset"
                ],
                "type": "string"
              },
              "sourceContentVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "subsetVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "trackingClaimDigest": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              }
            },
            "required": [
              "catalogueKey",
              "coverage",
              "loadConvention",
              "mappingVersion",
              "qualification",
              "sourceContentVersion",
              "subsetVersion",
              "trackingClaimDigest"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "readyToStart": {
        "enum": [
          false
        ],
        "type": "boolean"
      },
      "reason": {
        "oneOf": [
          {
            "enum": [
              "explicit_reviewed_tracking"
            ],
            "type": "string"
          },
          {
            "enum": [
              "tracking_mapping_missing"
            ],
            "type": "string"
          },
          {
            "enum": [
              "load_convention_unknown"
            ],
            "type": "string"
          },
          {
            "enum": [
              "name_not_representable"
            ],
            "type": "string"
          },
          {
            "enum": [
              "source_guidance_not_representable"
            ],
            "type": "string"
          }
        ]
      },
      "sourceContentVersion": {
        "maxLength": 64,
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      },
      "state": {
        "oneOf": [
          {
            "enum": [
              "projected"
            ],
            "type": "string"
          },
          {
            "enum": [
              "requires_configuration"
            ],
            "type": "string"
          }
        ]
      },
      "subsetVersion": {
        "maxLength": 64,
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      }
    },
    "required": [
      "catalogueKey",
      "definition",
      "mappingVersion",
      "origin",
      "readyToStart",
      "reason",
      "sourceContentVersion",
      "state",
      "subsetVersion"
    ],
    "type": "object"
  },
  "Request": {
    "additionalProperties": false,
    "properties": {
      "catalogueKey": {
        "maxLength": 60,
        "pattern": "^ex\\.[0-9]+$",
        "type": "string"
      },
      "elementId": {
        "maxLength": 40,
        "minLength": 1,
        "pattern": "^[A-Za-z0-9_-]+$",
        "type": "string"
      },
      "epoch": {
        "maxLength": 128,
        "minLength": 1,
        "type": "string"
      },
      "issuedAt": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "locale": {
        "enum": [
          "fr",
          "en"
        ],
        "type": "string"
      },
      "mappingVersion": {
        "maxLength": 64,
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      },
      "operationId": {
        "format": "uuid",
        "type": "string"
      },
      "sourceContentVersion": {
        "maxLength": 64,
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      },
      "subsetVersion": {
        "maxLength": 64,
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      }
    },
    "required": [
      "catalogueKey",
      "elementId",
      "epoch",
      "issuedAt",
      "locale",
      "mappingVersion",
      "operationId",
      "sourceContentVersion",
      "subsetVersion"
    ],
    "type": "object"
  },
  "Result": {
    "additionalProperties": false,
    "properties": {
      "cursor": {
        "maxLength": 128,
        "type": "string"
      },
      "elementId": {
        "maxLength": 40,
        "type": "string"
      },
      "epoch": {
        "maxLength": 128,
        "type": "string"
      },
      "mutationId": {
        "maxLength": 128,
        "type": "string"
      },
      "origin": {
        "additionalProperties": false,
        "properties": {
          "catalogueKey": {
            "maxLength": 60,
            "pattern": "^ex\\.[0-9]+$",
            "type": "string"
          },
          "countingConvention": {
            "enum": [
              "alternating_opposite_pair_repetitions",
              "alternating_side_repetitions",
              "per_side_repetitions",
              "per_side_duration",
              "bilateral_repetitions"
            ],
            "type": "string"
          },
          "coverage": {
            "enum": [
              "partial"
            ],
            "type": "string"
          },
          "loadConvention": {
            "enum": [
              "total",
              "perImplement",
              "perSide",
              "bodyweight",
              "unknown"
            ],
            "type": "string"
          },
          "mappingVersion": {
            "maxLength": 64,
            "pattern": "^[a-f0-9]{64}$",
            "type": "string"
          },
          "qualification": {
            "enum": [
              "reviewed_subset"
            ],
            "type": "string"
          },
          "sourceContentVersion": {
            "maxLength": 64,
            "pattern": "^[a-f0-9]{64}$",
            "type": "string"
          },
          "subsetVersion": {
            "maxLength": 64,
            "pattern": "^[a-f0-9]{64}$",
            "type": "string"
          },
          "trackingClaimDigest": {
            "maxLength": 64,
            "pattern": "^[a-f0-9]{64}$",
            "type": "string"
          }
        },
        "required": [
          "catalogueKey",
          "coverage",
          "loadConvention",
          "mappingVersion",
          "qualification",
          "sourceContentVersion",
          "subsetVersion",
          "trackingClaimDigest"
        ],
        "type": "object"
      },
      "readyToStart": {
        "enum": [
          false
        ],
        "type": "boolean"
      },
      "revision": {
        "maxLength": 128,
        "type": "string"
      },
      "scope": {
        "maxLength": 137,
        "type": "string"
      },
      "state": {
        "enum": [
          "imported"
        ],
        "type": "string"
      }
    },
    "required": [
      "cursor",
      "elementId",
      "epoch",
      "mutationId",
      "origin",
      "readyToStart",
      "revision",
      "scope",
      "state"
    ],
    "type": "object"
  }
};
