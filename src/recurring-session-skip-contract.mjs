// Generated from the public TypeSpec recurring-session DTOs. Do not edit by hand.
export default {
  "Target": {
    "additionalProperties": false,
    "properties": {
      "athleteId": {
        "maxLength": 128,
        "pattern": "^[A-Za-z0-9_-]{1,128}$",
        "type": "string"
      },
      "scheduleId": {
        "maxLength": 256,
        "minLength": 1,
        "type": "string"
      },
      "scope": {
        "maxLength": 256,
        "minLength": 9,
        "pattern": "^project:.+$",
        "type": "string"
      },
      "trainingId": {
        "maxLength": 256,
        "minLength": 1,
        "type": "string"
      }
    },
    "required": [
      "athleteId",
      "scheduleId",
      "scope",
      "trainingId"
    ],
    "type": "object"
  },
  "Request": {
    "additionalProperties": false,
    "properties": {
      "operationId": {
        "format": "uuid",
        "maxLength": 36,
        "type": "string"
      },
      "representationVersion": {
        "enum": [
          1
        ],
        "type": "integer"
      },
      "target": {
        "additionalProperties": false,
        "properties": {
          "athleteId": {
            "maxLength": 128,
            "pattern": "^[A-Za-z0-9_-]{1,128}$",
            "type": "string"
          },
          "scheduleId": {
            "maxLength": 256,
            "minLength": 1,
            "type": "string"
          },
          "scope": {
            "maxLength": 256,
            "minLength": 9,
            "pattern": "^project:.+$",
            "type": "string"
          },
          "trainingId": {
            "maxLength": 256,
            "minLength": 1,
            "type": "string"
          }
        },
        "required": [
          "athleteId",
          "scheduleId",
          "scope",
          "trainingId"
        ],
        "type": "object"
      }
    },
    "required": [
      "operationId",
      "representationVersion",
      "target"
    ],
    "type": "object"
  },
  "Confirmation": {
    "additionalProperties": false,
    "properties": {
      "occurrenceKey": {
        "maxLength": 16,
        "pattern": "^[0-9]{8}T[0-9]{6}Z$",
        "type": "string"
      },
      "request": {
        "additionalProperties": false,
        "properties": {
          "operationId": {
            "format": "uuid",
            "maxLength": 36,
            "type": "string"
          },
          "representationVersion": {
            "enum": [
              1
            ],
            "type": "integer"
          },
          "target": {
            "additionalProperties": false,
            "properties": {
              "athleteId": {
                "maxLength": 128,
                "pattern": "^[A-Za-z0-9_-]{1,128}$",
                "type": "string"
              },
              "scheduleId": {
                "maxLength": 256,
                "minLength": 1,
                "type": "string"
              },
              "scope": {
                "maxLength": 256,
                "minLength": 9,
                "pattern": "^project:.+$",
                "type": "string"
              },
              "trainingId": {
                "maxLength": 256,
                "minLength": 1,
                "type": "string"
              }
            },
            "required": [
              "athleteId",
              "scheduleId",
              "scope",
              "trainingId"
            ],
            "type": "object"
          }
        },
        "required": [
          "operationId",
          "representationVersion",
          "target"
        ],
        "type": "object"
      },
      "scheduleRevision": {
        "maxLength": 128,
        "minLength": 1,
        "type": "string"
      },
      "session": {
        "additionalProperties": false,
        "properties": {
          "decisionRevision": {
            "format": "int32",
            "maximum": 2147483647,
            "minimum": 0,
            "type": "integer"
          },
          "epoch": {
            "maxLength": 128,
            "minLength": 1,
            "type": "string"
          },
          "expectedRevision": {
            "anyOf": [
              {
                "maxLength": 128,
                "minLength": 1,
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
          "previewKey": {
            "maxLength": 64,
            "pattern": "^[a-f0-9]{64}$",
            "type": "string"
          },
          "request": {
            "additionalProperties": false,
            "properties": {
              "action": {
                "enum": [
                  "skip",
                  "restore"
                ],
                "type": "string"
              },
              "operationId": {
                "format": "uuid",
                "maxLength": 36,
                "type": "string"
              },
              "representationVersion": {
                "enum": [
                  1
                ],
                "type": "integer"
              },
              "target": {
                "additionalProperties": false,
                "properties": {
                  "athleteId": {
                    "maxLength": 128,
                    "pattern": "^[A-Za-z0-9_-]{1,128}$",
                    "type": "string"
                  },
                  "scope": {
                    "maxLength": 256,
                    "minLength": 9,
                    "pattern": "^project:.+$",
                    "type": "string"
                  },
                  "taskId": {
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
                  "athleteId",
                  "scope",
                  "taskId",
                  "trainingId"
                ],
                "type": "object"
              }
            },
            "required": [
              "action",
              "operationId",
              "representationVersion",
              "target"
            ],
            "type": "object"
          }
        },
        "required": [
          "decisionRevision",
          "epoch",
          "expectedRevision",
          "preparedAt",
          "previewKey",
          "request"
        ],
        "type": "object"
      }
    },
    "required": [
      "occurrenceKey",
      "request",
      "scheduleRevision",
      "session"
    ],
    "type": "object"
  },
  "Preview": {
    "additionalProperties": false,
    "properties": {
      "confirmation": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "occurrenceKey": {
                "maxLength": 16,
                "pattern": "^[0-9]{8}T[0-9]{6}Z$",
                "type": "string"
              },
              "request": {
                "additionalProperties": false,
                "properties": {
                  "operationId": {
                    "format": "uuid",
                    "maxLength": 36,
                    "type": "string"
                  },
                  "representationVersion": {
                    "enum": [
                      1
                    ],
                    "type": "integer"
                  },
                  "target": {
                    "additionalProperties": false,
                    "properties": {
                      "athleteId": {
                        "maxLength": 128,
                        "pattern": "^[A-Za-z0-9_-]{1,128}$",
                        "type": "string"
                      },
                      "scheduleId": {
                        "maxLength": 256,
                        "minLength": 1,
                        "type": "string"
                      },
                      "scope": {
                        "maxLength": 256,
                        "minLength": 9,
                        "pattern": "^project:.+$",
                        "type": "string"
                      },
                      "trainingId": {
                        "maxLength": 256,
                        "minLength": 1,
                        "type": "string"
                      }
                    },
                    "required": [
                      "athleteId",
                      "scheduleId",
                      "scope",
                      "trainingId"
                    ],
                    "type": "object"
                  }
                },
                "required": [
                  "operationId",
                  "representationVersion",
                  "target"
                ],
                "type": "object"
              },
              "scheduleRevision": {
                "maxLength": 128,
                "minLength": 1,
                "type": "string"
              },
              "session": {
                "additionalProperties": false,
                "properties": {
                  "decisionRevision": {
                    "format": "int32",
                    "maximum": 2147483647,
                    "minimum": 0,
                    "type": "integer"
                  },
                  "epoch": {
                    "maxLength": 128,
                    "minLength": 1,
                    "type": "string"
                  },
                  "expectedRevision": {
                    "anyOf": [
                      {
                        "maxLength": 128,
                        "minLength": 1,
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
                  "previewKey": {
                    "maxLength": 64,
                    "pattern": "^[a-f0-9]{64}$",
                    "type": "string"
                  },
                  "request": {
                    "additionalProperties": false,
                    "properties": {
                      "action": {
                        "enum": [
                          "skip",
                          "restore"
                        ],
                        "type": "string"
                      },
                      "operationId": {
                        "format": "uuid",
                        "maxLength": 36,
                        "type": "string"
                      },
                      "representationVersion": {
                        "enum": [
                          1
                        ],
                        "type": "integer"
                      },
                      "target": {
                        "additionalProperties": false,
                        "properties": {
                          "athleteId": {
                            "maxLength": 128,
                            "pattern": "^[A-Za-z0-9_-]{1,128}$",
                            "type": "string"
                          },
                          "scope": {
                            "maxLength": 256,
                            "minLength": 9,
                            "pattern": "^project:.+$",
                            "type": "string"
                          },
                          "taskId": {
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
                          "athleteId",
                          "scope",
                          "taskId",
                          "trainingId"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "action",
                      "operationId",
                      "representationVersion",
                      "target"
                    ],
                    "type": "object"
                  }
                },
                "required": [
                  "decisionRevision",
                  "epoch",
                  "expectedRevision",
                  "preparedAt",
                  "previewKey",
                  "request"
                ],
                "type": "object"
              }
            },
            "required": [
              "occurrenceKey",
              "request",
              "scheduleRevision",
              "session"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "occurrenceKey": {
        "anyOf": [
          {
            "maxLength": 16,
            "pattern": "^[0-9]{8}T[0-9]{6}Z$",
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "reason": {
        "enum": [
          "review",
          "already_materialized",
          "workflow_not_supported",
          "date_mode_not_supported",
          "lookup_incomplete",
          "occurrence_unavailable",
          "occurrence_not_future",
          "already_skipped",
          "active_session",
          "completed_session",
          "activity_unknown",
          "start_pending"
        ],
        "type": "string"
      },
      "representationVersion": {
        "enum": [
          1
        ],
        "type": "integer"
      },
      "request": {
        "additionalProperties": false,
        "properties": {
          "operationId": {
            "format": "uuid",
            "maxLength": 36,
            "type": "string"
          },
          "representationVersion": {
            "enum": [
              1
            ],
            "type": "integer"
          },
          "target": {
            "additionalProperties": false,
            "properties": {
              "athleteId": {
                "maxLength": 128,
                "pattern": "^[A-Za-z0-9_-]{1,128}$",
                "type": "string"
              },
              "scheduleId": {
                "maxLength": 256,
                "minLength": 1,
                "type": "string"
              },
              "scope": {
                "maxLength": 256,
                "minLength": 9,
                "pattern": "^project:.+$",
                "type": "string"
              },
              "trainingId": {
                "maxLength": 256,
                "minLength": 1,
                "type": "string"
              }
            },
            "required": [
              "athleteId",
              "scheduleId",
              "scope",
              "trainingId"
            ],
            "type": "object"
          }
        },
        "required": [
          "operationId",
          "representationVersion",
          "target"
        ],
        "type": "object"
      },
      "session": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "decision": {
                "anyOf": [
                  {
                    "additionalProperties": false,
                    "properties": {
                      "actorId": {
                        "maxLength": 128,
                        "minLength": 1,
                        "type": "string"
                      },
                      "decidedAt": {
                        "format": "int64",
                        "minimum": 0,
                        "type": "integer"
                      },
                      "disposition": {
                        "enum": [
                          "skipped",
                          "restored"
                        ],
                        "type": "string"
                      },
                      "operationId": {
                        "format": "uuid",
                        "maxLength": 36,
                        "type": "string"
                      },
                      "sourceVersion": {
                        "maxLength": 64,
                        "pattern": "^[a-f0-9]{64}$",
                        "type": "string"
                      },
                      "startsAt": {
                        "format": "date-time",
                        "maxLength": 40,
                        "type": "string"
                      },
                      "target": {
                        "additionalProperties": false,
                        "properties": {
                          "athleteId": {
                            "maxLength": 128,
                            "pattern": "^[A-Za-z0-9_-]{1,128}$",
                            "type": "string"
                          },
                          "scope": {
                            "maxLength": 256,
                            "minLength": 9,
                            "pattern": "^project:.+$",
                            "type": "string"
                          },
                          "taskId": {
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
                          "athleteId",
                          "scope",
                          "taskId",
                          "trainingId"
                        ],
                        "type": "object"
                      }
                    },
                    "required": [
                      "actorId",
                      "decidedAt",
                      "disposition",
                      "operationId",
                      "sourceVersion",
                      "startsAt",
                      "target"
                    ],
                    "type": "object"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "decisionRevision": {
                "format": "int32",
                "maximum": 2147483647,
                "minimum": 0,
                "type": "integer"
              },
              "epoch": {
                "maxLength": 128,
                "minLength": 1,
                "type": "string"
              },
              "expectedRevision": {
                "anyOf": [
                  {
                    "maxLength": 128,
                    "minLength": 1,
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "expiresAt": {
                "format": "int64",
                "minimum": 0,
                "type": "integer"
              },
              "key": {
                "anyOf": [
                  {
                    "maxLength": 64,
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
              "reason": {
                "enum": [
                  "review",
                  "already_skipped",
                  "not_skipped",
                  "active_session",
                  "completed_session",
                  "activity_unknown",
                  "start_pending",
                  "occurrence_not_dated",
                  "occurrence_not_future",
                  "source_changed"
                ],
                "type": "string"
              },
              "representationVersion": {
                "enum": [
                  1
                ],
                "type": "integer"
              },
              "request": {
                "additionalProperties": false,
                "properties": {
                  "action": {
                    "enum": [
                      "skip",
                      "restore"
                    ],
                    "type": "string"
                  },
                  "operationId": {
                    "format": "uuid",
                    "maxLength": 36,
                    "type": "string"
                  },
                  "representationVersion": {
                    "enum": [
                      1
                    ],
                    "type": "integer"
                  },
                  "target": {
                    "additionalProperties": false,
                    "properties": {
                      "athleteId": {
                        "maxLength": 128,
                        "pattern": "^[A-Za-z0-9_-]{1,128}$",
                        "type": "string"
                      },
                      "scope": {
                        "maxLength": 256,
                        "minLength": 9,
                        "pattern": "^project:.+$",
                        "type": "string"
                      },
                      "taskId": {
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
                      "athleteId",
                      "scope",
                      "taskId",
                      "trainingId"
                    ],
                    "type": "object"
                  }
                },
                "required": [
                  "action",
                  "operationId",
                  "representationVersion",
                  "target"
                ],
                "type": "object"
              },
              "sourceVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "startsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "maxLength": 40,
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "state": {
                "enum": [
                  "review",
                  "blocked"
                ],
                "type": "string"
              }
            },
            "required": [
              "decision",
              "decisionRevision",
              "epoch",
              "expectedRevision",
              "expiresAt",
              "key",
              "preparedAt",
              "reason",
              "representationVersion",
              "request",
              "sourceVersion",
              "startsAt",
              "state"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "state": {
        "enum": [
          "review",
          "materialized",
          "blocked"
        ],
        "type": "string"
      }
    },
    "required": [
      "confirmation",
      "occurrenceKey",
      "reason",
      "representationVersion",
      "request",
      "session",
      "state"
    ],
    "type": "object"
  },
  "Result": {
    "additionalProperties": false,
    "properties": {
      "occurrenceKey": {
        "maxLength": 16,
        "pattern": "^[0-9]{8}T[0-9]{6}Z$",
        "type": "string"
      },
      "representationVersion": {
        "enum": [
          1
        ],
        "type": "integer"
      },
      "request": {
        "additionalProperties": false,
        "properties": {
          "operationId": {
            "format": "uuid",
            "maxLength": 36,
            "type": "string"
          },
          "representationVersion": {
            "enum": [
              1
            ],
            "type": "integer"
          },
          "target": {
            "additionalProperties": false,
            "properties": {
              "athleteId": {
                "maxLength": 128,
                "pattern": "^[A-Za-z0-9_-]{1,128}$",
                "type": "string"
              },
              "scheduleId": {
                "maxLength": 256,
                "minLength": 1,
                "type": "string"
              },
              "scope": {
                "maxLength": 256,
                "minLength": 9,
                "pattern": "^project:.+$",
                "type": "string"
              },
              "trainingId": {
                "maxLength": 256,
                "minLength": 1,
                "type": "string"
              }
            },
            "required": [
              "athleteId",
              "scheduleId",
              "scope",
              "trainingId"
            ],
            "type": "object"
          }
        },
        "required": [
          "operationId",
          "representationVersion",
          "target"
        ],
        "type": "object"
      },
      "session": {
        "additionalProperties": false,
        "properties": {
          "cursor": {
            "maxLength": 128,
            "minLength": 1,
            "type": "string"
          },
          "decision": {
            "additionalProperties": false,
            "properties": {
              "actorId": {
                "maxLength": 128,
                "minLength": 1,
                "type": "string"
              },
              "decidedAt": {
                "format": "int64",
                "minimum": 0,
                "type": "integer"
              },
              "disposition": {
                "enum": [
                  "skipped",
                  "restored"
                ],
                "type": "string"
              },
              "operationId": {
                "format": "uuid",
                "maxLength": 36,
                "type": "string"
              },
              "sourceVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "startsAt": {
                "format": "date-time",
                "maxLength": 40,
                "type": "string"
              },
              "target": {
                "additionalProperties": false,
                "properties": {
                  "athleteId": {
                    "maxLength": 128,
                    "pattern": "^[A-Za-z0-9_-]{1,128}$",
                    "type": "string"
                  },
                  "scope": {
                    "maxLength": 256,
                    "minLength": 9,
                    "pattern": "^project:.+$",
                    "type": "string"
                  },
                  "taskId": {
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
                  "athleteId",
                  "scope",
                  "taskId",
                  "trainingId"
                ],
                "type": "object"
              }
            },
            "required": [
              "actorId",
              "decidedAt",
              "disposition",
              "operationId",
              "sourceVersion",
              "startsAt",
              "target"
            ],
            "type": "object"
          },
          "epoch": {
            "maxLength": 128,
            "minLength": 1,
            "type": "string"
          },
          "mutationId": {
            "maxLength": 128,
            "minLength": 1,
            "type": "string"
          },
          "representationVersion": {
            "enum": [
              1
            ],
            "type": "integer"
          },
          "revision": {
            "maxLength": 128,
            "minLength": 1,
            "type": "string"
          },
          "target": {
            "additionalProperties": false,
            "properties": {
              "athleteId": {
                "maxLength": 128,
                "pattern": "^[A-Za-z0-9_-]{1,128}$",
                "type": "string"
              },
              "scope": {
                "maxLength": 256,
                "minLength": 9,
                "pattern": "^project:.+$",
                "type": "string"
              },
              "taskId": {
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
              "athleteId",
              "scope",
              "taskId",
              "trainingId"
            ],
            "type": "object"
          }
        },
        "required": [
          "cursor",
          "decision",
          "epoch",
          "mutationId",
          "representationVersion",
          "revision",
          "target"
        ],
        "type": "object"
      }
    },
    "required": [
      "occurrenceKey",
      "representationVersion",
      "request",
      "session"
    ],
    "type": "object"
  }
};
