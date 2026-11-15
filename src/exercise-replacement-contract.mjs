// Generated from the public TypeSpec exercise-replacement DTOs. Do not edit by hand.
export default {
  "Request": {
    "additionalProperties": false,
    "properties": {
      "locale": {
        "enum": [
          "fr",
          "en"
        ],
        "type": "string"
      },
      "newExerciseId": {
        "maxLength": 40,
        "minLength": 1,
        "type": "string"
      },
      "oldExerciseId": {
        "maxLength": 40,
        "minLength": 1,
        "type": "string"
      },
      "requestId": {
        "format": "uuid",
        "type": "string"
      },
      "scope": {
        "maxLength": 256,
        "minLength": 9,
        "pattern": "^project:.+$",
        "type": "string"
      },
      "slotId": {
        "maxLength": 256,
        "minLength": 1,
        "type": "string"
      },
      "trainingId": {
        "maxLength": 256,
        "minLength": 1,
        "type": "string"
      }
    },
    "required": [
      "locale",
      "newExerciseId",
      "oldExerciseId",
      "requestId",
      "scope",
      "slotId",
      "trainingId"
    ],
    "type": "object"
  },
  "Confirmation": {
    "additionalProperties": false,
    "properties": {
      "action": {
        "enum": [
          "confirm"
        ],
        "type": "string"
      },
      "epoch": {
        "maxLength": 128,
        "type": "string"
      },
      "expectedRevision": {
        "maxLength": 128,
        "type": "string"
      },
      "preparedAt": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "previewKey": {
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      },
      "request": {
        "additionalProperties": false,
        "properties": {
          "locale": {
            "enum": [
              "fr",
              "en"
            ],
            "type": "string"
          },
          "newExerciseId": {
            "maxLength": 40,
            "minLength": 1,
            "type": "string"
          },
          "oldExerciseId": {
            "maxLength": 40,
            "minLength": 1,
            "type": "string"
          },
          "requestId": {
            "format": "uuid",
            "type": "string"
          },
          "scope": {
            "maxLength": 256,
            "minLength": 9,
            "pattern": "^project:.+$",
            "type": "string"
          },
          "slotId": {
            "maxLength": 256,
            "minLength": 1,
            "type": "string"
          },
          "trainingId": {
            "maxLength": 256,
            "minLength": 1,
            "type": "string"
          }
        },
        "required": [
          "locale",
          "newExerciseId",
          "oldExerciseId",
          "requestId",
          "scope",
          "slotId",
          "trainingId"
        ],
        "type": "object"
      }
    },
    "required": [
      "action",
      "epoch",
      "expectedRevision",
      "preparedAt",
      "previewKey",
      "request"
    ],
    "type": "object"
  },
  "Preview": {
    "additionalProperties": false,
    "properties": {
      "diff": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "after": {
                "additionalProperties": false,
                "properties": {
                  "elementId": {
                    "maxLength": 40,
                    "type": "string"
                  },
                  "exerciseType": {
                    "anyOf": [
                      {
                        "maxLength": 40,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "name": {
                    "anyOf": [
                      {
                        "maxLength": 120,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "order": {
                    "format": "int32",
                    "maximum": 100,
                    "minimum": 0,
                    "type": "integer"
                  },
                  "restSeconds": {
                    "format": "int32",
                    "maximum": 600,
                    "minimum": 0,
                    "type": "integer"
                  },
                  "snapshotMode": {
                    "oneOf": [
                      {
                        "enum": [
                          "personal_library"
                        ],
                        "type": "string"
                      },
                      {
                        "enum": [
                          "copied_definition"
                        ],
                        "type": "string"
                      }
                    ]
                  },
                  "sourceUnit": {
                    "anyOf": [
                      {
                        "enum": [
                          "kg",
                          "lb",
                          "none"
                        ],
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "targetSets": {
                    "anyOf": [
                      {
                        "maxLength": 4000,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                },
                "required": [
                  "elementId",
                  "exerciseType",
                  "name",
                  "order",
                  "restSeconds",
                  "snapshotMode",
                  "sourceUnit",
                  "targetSets"
                ],
                "type": "object"
              },
              "before": {
                "additionalProperties": false,
                "properties": {
                  "elementId": {
                    "maxLength": 40,
                    "type": "string"
                  },
                  "exerciseType": {
                    "anyOf": [
                      {
                        "maxLength": 40,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "name": {
                    "anyOf": [
                      {
                        "maxLength": 120,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "order": {
                    "format": "int32",
                    "maximum": 100,
                    "minimum": 0,
                    "type": "integer"
                  },
                  "restSeconds": {
                    "format": "int32",
                    "maximum": 600,
                    "minimum": 0,
                    "type": "integer"
                  },
                  "snapshotMode": {
                    "oneOf": [
                      {
                        "enum": [
                          "personal_library"
                        ],
                        "type": "string"
                      },
                      {
                        "enum": [
                          "copied_definition"
                        ],
                        "type": "string"
                      }
                    ]
                  },
                  "sourceUnit": {
                    "anyOf": [
                      {
                        "enum": [
                          "kg",
                          "lb",
                          "none"
                        ],
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "targetSets": {
                    "anyOf": [
                      {
                        "maxLength": 4000,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                },
                "required": [
                  "elementId",
                  "exerciseType",
                  "name",
                  "order",
                  "restSeconds",
                  "snapshotMode",
                  "sourceUnit",
                  "targetSets"
                ],
                "type": "object"
              },
              "cleared": {
                "items": {
                  "maxLength": 40,
                  "type": "string"
                },
                "maxItems": 8,
                "type": "array"
              },
              "doseEquivalenceEstablished": {
                "enum": [
                  false
                ],
                "type": "boolean"
              },
              "prescriptionStatus": {
                "enum": [
                  "requires_configuration"
                ],
                "type": "string"
              },
              "retained": {
                "items": {
                  "maxLength": 40,
                  "type": "string"
                },
                "maxItems": 8,
                "type": "array"
              }
            },
            "required": [
              "after",
              "before",
              "cleared",
              "doseEquivalenceEstablished",
              "prescriptionStatus",
              "retained"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "epoch": {
        "maxLength": 128,
        "type": "string"
      },
      "expectedRevision": {
        "maxLength": 128,
        "type": "string"
      },
      "expiresAt": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "key": {
        "anyOf": [
          {
            "pattern": "^[a-f0-9]{64}$",
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "preparedAt": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
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
              "review"
            ],
            "type": "string"
          },
          {
            "enum": [
              "unchanged"
            ],
            "type": "string"
          },
          {
            "enum": [
              "active_session"
            ],
            "type": "string"
          },
          {
            "enum": [
              "definition_unconfigured"
            ],
            "type": "string"
          },
          {
            "enum": [
              "duplicate_element"
            ],
            "type": "string"
          },
          {
            "enum": [
              "source_unavailable"
            ],
            "type": "string"
          }
        ]
      },
      "request": {
        "additionalProperties": false,
        "properties": {
          "locale": {
            "enum": [
              "fr",
              "en"
            ],
            "type": "string"
          },
          "newExerciseId": {
            "maxLength": 40,
            "minLength": 1,
            "type": "string"
          },
          "oldExerciseId": {
            "maxLength": 40,
            "minLength": 1,
            "type": "string"
          },
          "requestId": {
            "format": "uuid",
            "type": "string"
          },
          "scope": {
            "maxLength": 256,
            "minLength": 9,
            "pattern": "^project:.+$",
            "type": "string"
          },
          "slotId": {
            "maxLength": 256,
            "minLength": 1,
            "type": "string"
          },
          "trainingId": {
            "maxLength": 256,
            "minLength": 1,
            "type": "string"
          }
        },
        "required": [
          "locale",
          "newExerciseId",
          "oldExerciseId",
          "requestId",
          "scope",
          "slotId",
          "trainingId"
        ],
        "type": "object"
      },
      "sourceKey": {
        "pattern": "^[a-f0-9]{64}$",
        "type": "string"
      },
      "state": {
        "oneOf": [
          {
            "enum": [
              "review"
            ],
            "type": "string"
          },
          {
            "enum": [
              "unchanged"
            ],
            "type": "string"
          },
          {
            "enum": [
              "blocked"
            ],
            "type": "string"
          }
        ]
      },
      "trace": {
        "items": {
          "additionalProperties": false,
          "properties": {
            "nodeId": {
              "maxLength": 80,
              "type": "string"
            },
            "state": {
              "oneOf": [
                {
                  "enum": [
                    "yes"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "no"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "unknown"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "end"
                  ],
                  "type": "string"
                }
              ]
            }
          },
          "required": [
            "nodeId",
            "state"
          ],
          "type": "object"
        },
        "maxItems": 10,
        "type": "array"
      }
    },
    "required": [
      "diff",
      "epoch",
      "expectedRevision",
      "expiresAt",
      "key",
      "preparedAt",
      "readyToStart",
      "reason",
      "request",
      "sourceKey",
      "state",
      "trace"
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
      "prescriptionStatus": {
        "enum": [
          "requires_configuration"
        ],
        "type": "string"
      },
      "revision": {
        "maxLength": 128,
        "type": "string"
      },
      "scope": {
        "maxLength": 256,
        "type": "string"
      },
      "slotId": {
        "maxLength": 256,
        "type": "string"
      },
      "state": {
        "enum": [
          "replaced"
        ],
        "type": "string"
      },
      "trainingId": {
        "maxLength": 256,
        "type": "string"
      }
    },
    "required": [
      "cursor",
      "elementId",
      "epoch",
      "mutationId",
      "prescriptionStatus",
      "revision",
      "scope",
      "slotId",
      "state",
      "trainingId"
    ],
    "type": "object"
  }
};
