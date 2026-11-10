// Generated from the public TypeSpec temporary-action V3 DTOs. Do not edit by hand.
export default {
  "ReadRequest": {
    "additionalProperties": false,
    "properties": {
      "athleteId": {
        "maxLength": 128,
        "pattern": "^[A-Za-z0-9_-]{1,128}$",
        "type": "string"
      },
      "representationVersion": {
        "enum": [
          3
        ],
        "type": "integer"
      },
      "scope": {
        "maxLength": 160,
        "pattern": "^project:[A-Za-z0-9_-]{1,128}$",
        "type": "string"
      },
      "sessionId": {
        "anyOf": [
          {
            "format": "uuid",
            "maxLength": 36,
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      }
    },
    "required": [
      "athleteId",
      "representationVersion",
      "scope",
      "sessionId"
    ],
    "type": "object"
  },
  "ResolveRequest": {
    "additionalProperties": false,
    "properties": {
      "athleteId": {
        "maxLength": 128,
        "pattern": "^[A-Za-z0-9_-]{1,128}$",
        "type": "string"
      },
      "exercise": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "selection": {
                "oneOf": [
                  {
                    "enum": [
                      "current"
                    ],
                    "type": "string"
                  },
                  {
                    "enum": [
                      "next"
                    ],
                    "type": "string"
                  },
                  {
                    "enum": [
                      "exact"
                    ],
                    "type": "string"
                  }
                ]
              },
              "target": {
                "anyOf": [
                  {
                    "additionalProperties": false,
                    "properties": {
                      "exerciseId": {
                        "maxLength": 128,
                        "minLength": 1,
                        "type": "string"
                      },
                      "occurrenceId": {
                        "anyOf": [
                          {
                            "maxLength": 128,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "projectId": {
                        "maxLength": 128,
                        "pattern": "^[A-Za-z0-9_-]{1,128}$",
                        "type": "string"
                      },
                      "sessionId": {
                        "anyOf": [
                          {
                            "format": "uuid",
                            "maxLength": 36,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "setIndex": {
                        "anyOf": [
                          {
                            "format": "int32",
                            "maximum": 1000,
                            "minimum": 1,
                            "type": "integer"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "trainingId": {
                        "maxLength": 128,
                        "minLength": 1,
                        "type": "string"
                      }
                    },
                    "required": [
                      "exerciseId",
                      "occurrenceId",
                      "projectId",
                      "sessionId",
                      "setIndex",
                      "trainingId"
                    ],
                    "type": "object"
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            },
            "required": [
              "selection",
              "target"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "regional": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "endsAt": {
                "format": "date-time",
                "type": "string"
              },
              "regionalEmphasis": {
                "additionalProperties": false,
                "properties": {
                  "lower": {
                    "anyOf": [
                      {
                        "enum": [
                          "low",
                          "moderate",
                          "high"
                        ],
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "policyVersion": {
                    "maxLength": 80,
                    "minLength": 1,
                    "type": "string"
                  },
                  "upper": {
                    "anyOf": [
                      {
                        "enum": [
                          "low",
                          "moderate",
                          "high"
                        ],
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                },
                "required": [
                  "lower",
                  "policyVersion",
                  "upper"
                ],
                "type": "object"
              },
              "selection": {
                "enum": [
                  "exact"
                ],
                "type": "string"
              },
              "startsAt": {
                "format": "date-time",
                "type": "string"
              },
              "target": {
                "additionalProperties": false,
                "properties": {
                  "occurrenceId": {
                    "anyOf": [
                      {
                        "maxLength": 256,
                        "minLength": 1,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "projectId": {
                    "maxLength": 128,
                    "pattern": "^[A-Za-z0-9_-]{1,128}$",
                    "type": "string"
                  },
                  "sessionId": {
                    "anyOf": [
                      {
                        "format": "uuid",
                        "maxLength": 36,
                        "minLength": 36,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "targetType": {
                    "enum": [
                      "workout_occurrence"
                    ],
                    "type": "string"
                  },
                  "trainingId": {
                    "maxLength": 256,
                    "minLength": 1,
                    "type": "string"
                  }
                },
                "required": [
                  "occurrenceId",
                  "projectId",
                  "sessionId",
                  "targetType",
                  "trainingId"
                ],
                "type": "object"
              }
            },
            "required": [
              "endsAt",
              "regionalEmphasis",
              "selection",
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
      "representationVersion": {
        "enum": [
          3
        ],
        "type": "integer"
      },
      "scope": {
        "maxLength": 160,
        "pattern": "^project:[A-Za-z0-9_-]{1,128}$",
        "type": "string"
      },
      "sessionId": {
        "anyOf": [
          {
            "format": "uuid",
            "maxLength": 36,
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "targetKind": {
        "enum": [
          "exercise",
          "regional"
        ],
        "type": "string"
      }
    },
    "required": [
      "athleteId",
      "exercise",
      "regional",
      "representationVersion",
      "scope",
      "sessionId",
      "targetKind"
    ],
    "type": "object"
  },
  "AgentData": {
    "additionalProperties": false,
    "properties": {
      "athleteId": {
        "maxLength": 128,
        "pattern": "^[A-Za-z0-9_-]{1,128}$",
        "type": "string"
      },
      "exercise": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "endsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "focusSelection": {
                "anyOf": [
                  {
                    "additionalProperties": false,
                    "properties": {
                      "policyVersion": {
                        "maxLength": 80,
                        "minLength": 1,
                        "type": "string"
                      },
                      "priority": {
                        "anyOf": [
                          {
                            "maxLength": 80,
                            "minLength": 1,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "selected": {
                        "items": {
                          "type": "string"
                        },
                        "maxItems": 3,
                        "minItems": 1,
                        "type": "array",
                        "uniqueItems": true
                      }
                    },
                    "required": [
                      "policyVersion",
                      "priority",
                      "selected"
                    ],
                    "type": "object"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "kind": {
                "anyOf": [
                  {
                    "enum": [
                      "focus",
                      "skip"
                    ],
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "objective": {
                "anyOf": [
                  {
                    "enum": [
                      "comfort",
                      "hypertrophy",
                      "strength",
                      "consistency",
                      "skip_once",
                      "multiple_axes"
                    ],
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "sourceVersion": {
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
              "startsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "target": {
                "anyOf": [
                  {
                    "additionalProperties": false,
                    "properties": {
                      "exerciseId": {
                        "maxLength": 128,
                        "minLength": 1,
                        "type": "string"
                      },
                      "occurrenceId": {
                        "anyOf": [
                          {
                            "maxLength": 128,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "projectId": {
                        "maxLength": 128,
                        "pattern": "^[A-Za-z0-9_-]{1,128}$",
                        "type": "string"
                      },
                      "sessionId": {
                        "anyOf": [
                          {
                            "format": "uuid",
                            "maxLength": 36,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "setIndex": {
                        "anyOf": [
                          {
                            "format": "int32",
                            "maximum": 1000,
                            "minimum": 1,
                            "type": "integer"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "trainingId": {
                        "maxLength": 128,
                        "minLength": 1,
                        "type": "string"
                      }
                    },
                    "required": [
                      "exerciseId",
                      "occurrenceId",
                      "projectId",
                      "sessionId",
                      "setIndex",
                      "trainingId"
                    ],
                    "type": "object"
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            },
            "required": [
              "endsAt",
              "focusSelection",
              "kind",
              "objective",
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
      "regional": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "endsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "kind": {
                "anyOf": [
                  {
                    "enum": [
                      "regional_emphasis"
                    ],
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "objective": {
                "anyOf": [
                  {
                    "enum": [
                      "regional_distribution"
                    ],
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "regionalEmphasis": {
                "anyOf": [
                  {
                    "additionalProperties": false,
                    "properties": {
                      "lower": {
                        "anyOf": [
                          {
                            "enum": [
                              "low",
                              "moderate",
                              "high"
                            ],
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "policyVersion": {
                        "maxLength": 80,
                        "minLength": 1,
                        "type": "string"
                      },
                      "upper": {
                        "anyOf": [
                          {
                            "enum": [
                              "low",
                              "moderate",
                              "high"
                            ],
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      }
                    },
                    "required": [
                      "lower",
                      "policyVersion",
                      "upper"
                    ],
                    "type": "object"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "sourceVersion": {
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
              "startsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "target": {
                "anyOf": [
                  {
                    "additionalProperties": false,
                    "properties": {
                      "occurrenceId": {
                        "anyOf": [
                          {
                            "maxLength": 256,
                            "minLength": 1,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "projectId": {
                        "maxLength": 128,
                        "pattern": "^[A-Za-z0-9_-]{1,128}$",
                        "type": "string"
                      },
                      "sessionId": {
                        "anyOf": [
                          {
                            "format": "uuid",
                            "maxLength": 36,
                            "minLength": 36,
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "targetType": {
                        "enum": [
                          "workout_occurrence"
                        ],
                        "type": "string"
                      },
                      "trainingId": {
                        "maxLength": 256,
                        "minLength": 1,
                        "type": "string"
                      }
                    },
                    "required": [
                      "occurrenceId",
                      "projectId",
                      "sessionId",
                      "targetType",
                      "trainingId"
                    ],
                    "type": "object"
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            },
            "required": [
              "endsAt",
              "kind",
              "objective",
              "regionalEmphasis",
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
      "representationVersion": {
        "enum": [
          3
        ],
        "type": "integer"
      },
      "sessionId": {
        "anyOf": [
          {
            "format": "uuid",
            "maxLength": 36,
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "targetKind": {
        "enum": [
          "exercise",
          "regional"
        ],
        "type": "string"
      }
    },
    "required": [
      "athleteId",
      "exercise",
      "regional",
      "representationVersion",
      "sessionId",
      "targetKind"
    ],
    "type": "object"
  },
  "Snapshot": {
    "additionalProperties": false,
    "properties": {
      "entries": {
        "items": {
          "additionalProperties": false,
          "properties": {
            "exercise": {
              "anyOf": [
                {
                  "additionalProperties": false,
                  "properties": {
                    "actorId": {
                      "maxLength": 128,
                      "type": "string"
                    },
                    "endsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "exerciseName": {
                      "maxLength": 200,
                      "type": "string"
                    },
                    "focusSelection": {
                      "anyOf": [
                        {
                          "additionalProperties": false,
                          "properties": {
                            "policyVersion": {
                              "maxLength": 80,
                              "minLength": 1,
                              "type": "string"
                            },
                            "priority": {
                              "anyOf": [
                                {
                                  "maxLength": 80,
                                  "minLength": 1,
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "selected": {
                              "items": {
                                "type": "string"
                              },
                              "maxItems": 3,
                              "minItems": 1,
                              "type": "array",
                              "uniqueItems": true
                            }
                          },
                          "required": [
                            "policyVersion",
                            "priority",
                            "selected"
                          ],
                          "type": "object"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "id": {
                      "format": "uuid",
                      "maxLength": 36,
                      "type": "string"
                    },
                    "kind": {
                      "oneOf": [
                        {
                          "enum": [
                            "focus"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "skip"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "objective": {
                      "oneOf": [
                        {
                          "enum": [
                            "comfort"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "hypertrophy"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "strength"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "consistency"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "skip_once"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "multiple_axes"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "origin": {
                      "oneOf": [
                        {
                          "enum": [
                            "user"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "coach"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "agent"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "mcp"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "revision": {
                      "format": "int32",
                      "maximum": 2147483647,
                      "minimum": 1,
                      "type": "integer"
                    },
                    "startsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "state": {
                      "oneOf": [
                        {
                          "enum": [
                            "active"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "scheduled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "expired"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "cancelled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "consumed"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "superseded"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_target"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_access"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_policy"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "supersededBy": {
                      "anyOf": [
                        {
                          "format": "uuid",
                          "maxLength": 36,
                          "type": "string"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "target": {
                      "additionalProperties": false,
                      "properties": {
                        "exerciseId": {
                          "maxLength": 128,
                          "minLength": 1,
                          "type": "string"
                        },
                        "occurrenceId": {
                          "anyOf": [
                            {
                              "maxLength": 128,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "projectId": {
                          "maxLength": 128,
                          "pattern": "^[A-Za-z0-9_-]{1,128}$",
                          "type": "string"
                        },
                        "sessionId": {
                          "anyOf": [
                            {
                              "format": "uuid",
                              "maxLength": 36,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "setIndex": {
                          "anyOf": [
                            {
                              "format": "int32",
                              "maximum": 1000,
                              "minimum": 1,
                              "type": "integer"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "trainingId": {
                          "maxLength": 128,
                          "minLength": 1,
                          "type": "string"
                        }
                      },
                      "required": [
                        "exerciseId",
                        "occurrenceId",
                        "projectId",
                        "sessionId",
                        "setIndex",
                        "trainingId"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "actorId",
                    "endsAt",
                    "exerciseName",
                    "id",
                    "kind",
                    "objective",
                    "origin",
                    "revision",
                    "startsAt",
                    "state",
                    "supersededBy",
                    "target"
                  ],
                  "type": "object"
                },
                {
                  "type": "null"
                }
              ]
            },
            "kind": {
              "oneOf": [
                {
                  "enum": [
                    "focus"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "skip"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "regional_emphasis"
                  ],
                  "type": "string"
                }
              ]
            },
            "regional": {
              "anyOf": [
                {
                  "additionalProperties": false,
                  "properties": {
                    "actorId": {
                      "maxLength": 128,
                      "type": "string"
                    },
                    "endsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "id": {
                      "format": "uuid",
                      "maxLength": 36,
                      "type": "string"
                    },
                    "kind": {
                      "enum": [
                        "regional_emphasis"
                      ],
                      "type": "string"
                    },
                    "objective": {
                      "enum": [
                        "regional_distribution"
                      ],
                      "type": "string"
                    },
                    "origin": {
                      "oneOf": [
                        {
                          "enum": [
                            "user"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "coach"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "agent"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "mcp"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "regionalEmphasis": {
                      "additionalProperties": false,
                      "properties": {
                        "lower": {
                          "anyOf": [
                            {
                              "enum": [
                                "low",
                                "moderate",
                                "high"
                              ],
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "policyVersion": {
                          "maxLength": 80,
                          "minLength": 1,
                          "type": "string"
                        },
                        "upper": {
                          "anyOf": [
                            {
                              "enum": [
                                "low",
                                "moderate",
                                "high"
                              ],
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        }
                      },
                      "required": [
                        "lower",
                        "policyVersion",
                        "upper"
                      ],
                      "type": "object"
                    },
                    "revision": {
                      "format": "int32",
                      "maximum": 2147483647,
                      "minimum": 1,
                      "type": "integer"
                    },
                    "startsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "state": {
                      "oneOf": [
                        {
                          "enum": [
                            "active"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "scheduled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "expired"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "cancelled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "consumed"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "superseded"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_target"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_access"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_policy"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "supersededBy": {
                      "anyOf": [
                        {
                          "format": "uuid",
                          "maxLength": 36,
                          "type": "string"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "target": {
                      "additionalProperties": false,
                      "properties": {
                        "occurrenceId": {
                          "anyOf": [
                            {
                              "maxLength": 256,
                              "minLength": 1,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "projectId": {
                          "maxLength": 128,
                          "pattern": "^[A-Za-z0-9_-]{1,128}$",
                          "type": "string"
                        },
                        "sessionId": {
                          "anyOf": [
                            {
                              "format": "uuid",
                              "maxLength": 36,
                              "minLength": 36,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "targetType": {
                          "enum": [
                            "workout_occurrence"
                          ],
                          "type": "string"
                        },
                        "trainingId": {
                          "maxLength": 256,
                          "minLength": 1,
                          "type": "string"
                        }
                      },
                      "required": [
                        "occurrenceId",
                        "projectId",
                        "sessionId",
                        "targetType",
                        "trainingId"
                      ],
                      "type": "object"
                    },
                    "trainingName": {
                      "maxLength": 200,
                      "minLength": 1,
                      "type": "string"
                    }
                  },
                  "required": [
                    "actorId",
                    "endsAt",
                    "id",
                    "kind",
                    "objective",
                    "origin",
                    "regionalEmphasis",
                    "revision",
                    "startsAt",
                    "state",
                    "supersededBy",
                    "target",
                    "trainingName"
                  ],
                  "type": "object"
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "exercise",
            "kind",
            "regional"
          ],
          "type": "object"
        },
        "maxItems": 64,
        "type": "array"
      },
      "epoch": {
        "maxLength": 64,
        "type": "string"
      },
      "representationVersion": {
        "enum": [
          3
        ],
        "type": "integer"
      },
      "revision": {
        "anyOf": [
          {
            "maxLength": 64,
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "serverTime": {
        "format": "date-time",
        "type": "string"
      }
    },
    "required": [
      "entries",
      "epoch",
      "representationVersion",
      "revision",
      "serverTime"
    ],
    "type": "object"
  },
  "Resolved": {
    "additionalProperties": false,
    "properties": {
      "entries": {
        "items": {
          "additionalProperties": false,
          "properties": {
            "exercise": {
              "anyOf": [
                {
                  "additionalProperties": false,
                  "properties": {
                    "actorId": {
                      "maxLength": 128,
                      "type": "string"
                    },
                    "endsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "exerciseName": {
                      "maxLength": 200,
                      "type": "string"
                    },
                    "focusSelection": {
                      "anyOf": [
                        {
                          "additionalProperties": false,
                          "properties": {
                            "policyVersion": {
                              "maxLength": 80,
                              "minLength": 1,
                              "type": "string"
                            },
                            "priority": {
                              "anyOf": [
                                {
                                  "maxLength": 80,
                                  "minLength": 1,
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "selected": {
                              "items": {
                                "type": "string"
                              },
                              "maxItems": 3,
                              "minItems": 1,
                              "type": "array",
                              "uniqueItems": true
                            }
                          },
                          "required": [
                            "policyVersion",
                            "priority",
                            "selected"
                          ],
                          "type": "object"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "id": {
                      "format": "uuid",
                      "maxLength": 36,
                      "type": "string"
                    },
                    "kind": {
                      "oneOf": [
                        {
                          "enum": [
                            "focus"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "skip"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "objective": {
                      "oneOf": [
                        {
                          "enum": [
                            "comfort"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "hypertrophy"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "strength"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "consistency"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "skip_once"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "multiple_axes"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "origin": {
                      "oneOf": [
                        {
                          "enum": [
                            "user"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "coach"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "agent"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "mcp"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "revision": {
                      "format": "int32",
                      "maximum": 2147483647,
                      "minimum": 1,
                      "type": "integer"
                    },
                    "startsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "state": {
                      "oneOf": [
                        {
                          "enum": [
                            "active"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "scheduled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "expired"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "cancelled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "consumed"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "superseded"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_target"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_access"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_policy"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "supersededBy": {
                      "anyOf": [
                        {
                          "format": "uuid",
                          "maxLength": 36,
                          "type": "string"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "target": {
                      "additionalProperties": false,
                      "properties": {
                        "exerciseId": {
                          "maxLength": 128,
                          "minLength": 1,
                          "type": "string"
                        },
                        "occurrenceId": {
                          "anyOf": [
                            {
                              "maxLength": 128,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "projectId": {
                          "maxLength": 128,
                          "pattern": "^[A-Za-z0-9_-]{1,128}$",
                          "type": "string"
                        },
                        "sessionId": {
                          "anyOf": [
                            {
                              "format": "uuid",
                              "maxLength": 36,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "setIndex": {
                          "anyOf": [
                            {
                              "format": "int32",
                              "maximum": 1000,
                              "minimum": 1,
                              "type": "integer"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "trainingId": {
                          "maxLength": 128,
                          "minLength": 1,
                          "type": "string"
                        }
                      },
                      "required": [
                        "exerciseId",
                        "occurrenceId",
                        "projectId",
                        "sessionId",
                        "setIndex",
                        "trainingId"
                      ],
                      "type": "object"
                    }
                  },
                  "required": [
                    "actorId",
                    "endsAt",
                    "exerciseName",
                    "id",
                    "kind",
                    "objective",
                    "origin",
                    "revision",
                    "startsAt",
                    "state",
                    "supersededBy",
                    "target"
                  ],
                  "type": "object"
                },
                {
                  "type": "null"
                }
              ]
            },
            "kind": {
              "oneOf": [
                {
                  "enum": [
                    "focus"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "skip"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "regional_emphasis"
                  ],
                  "type": "string"
                }
              ]
            },
            "regional": {
              "anyOf": [
                {
                  "additionalProperties": false,
                  "properties": {
                    "actorId": {
                      "maxLength": 128,
                      "type": "string"
                    },
                    "endsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "id": {
                      "format": "uuid",
                      "maxLength": 36,
                      "type": "string"
                    },
                    "kind": {
                      "enum": [
                        "regional_emphasis"
                      ],
                      "type": "string"
                    },
                    "objective": {
                      "enum": [
                        "regional_distribution"
                      ],
                      "type": "string"
                    },
                    "origin": {
                      "oneOf": [
                        {
                          "enum": [
                            "user"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "coach"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "agent"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "mcp"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "regionalEmphasis": {
                      "additionalProperties": false,
                      "properties": {
                        "lower": {
                          "anyOf": [
                            {
                              "enum": [
                                "low",
                                "moderate",
                                "high"
                              ],
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "policyVersion": {
                          "maxLength": 80,
                          "minLength": 1,
                          "type": "string"
                        },
                        "upper": {
                          "anyOf": [
                            {
                              "enum": [
                                "low",
                                "moderate",
                                "high"
                              ],
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        }
                      },
                      "required": [
                        "lower",
                        "policyVersion",
                        "upper"
                      ],
                      "type": "object"
                    },
                    "revision": {
                      "format": "int32",
                      "maximum": 2147483647,
                      "minimum": 1,
                      "type": "integer"
                    },
                    "startsAt": {
                      "format": "date-time",
                      "type": "string"
                    },
                    "state": {
                      "oneOf": [
                        {
                          "enum": [
                            "active"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "scheduled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "expired"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "cancelled"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "consumed"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "superseded"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_target"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_access"
                          ],
                          "type": "string"
                        },
                        {
                          "enum": [
                            "stale_policy"
                          ],
                          "type": "string"
                        }
                      ]
                    },
                    "supersededBy": {
                      "anyOf": [
                        {
                          "format": "uuid",
                          "maxLength": 36,
                          "type": "string"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "target": {
                      "additionalProperties": false,
                      "properties": {
                        "occurrenceId": {
                          "anyOf": [
                            {
                              "maxLength": 256,
                              "minLength": 1,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "projectId": {
                          "maxLength": 128,
                          "pattern": "^[A-Za-z0-9_-]{1,128}$",
                          "type": "string"
                        },
                        "sessionId": {
                          "anyOf": [
                            {
                              "format": "uuid",
                              "maxLength": 36,
                              "minLength": 36,
                              "type": "string"
                            },
                            {
                              "type": "null"
                            }
                          ]
                        },
                        "targetType": {
                          "enum": [
                            "workout_occurrence"
                          ],
                          "type": "string"
                        },
                        "trainingId": {
                          "maxLength": 256,
                          "minLength": 1,
                          "type": "string"
                        }
                      },
                      "required": [
                        "occurrenceId",
                        "projectId",
                        "sessionId",
                        "targetType",
                        "trainingId"
                      ],
                      "type": "object"
                    },
                    "trainingName": {
                      "maxLength": 200,
                      "minLength": 1,
                      "type": "string"
                    }
                  },
                  "required": [
                    "actorId",
                    "endsAt",
                    "id",
                    "kind",
                    "objective",
                    "origin",
                    "regionalEmphasis",
                    "revision",
                    "startsAt",
                    "state",
                    "supersededBy",
                    "target",
                    "trainingName"
                  ],
                  "type": "object"
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "exercise",
            "kind",
            "regional"
          ],
          "type": "object"
        },
        "maxItems": 64,
        "type": "array"
      },
      "epoch": {
        "maxLength": 64,
        "type": "string"
      },
      "exercise": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "exerciseName": {
                "maxLength": 200,
                "type": "string"
              },
              "occurrenceStartsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "replaces": {
                "items": {
                  "type": "string"
                },
                "maxItems": 32,
                "type": "array"
              },
              "sourceVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "target": {
                "additionalProperties": false,
                "properties": {
                  "exerciseId": {
                    "maxLength": 128,
                    "minLength": 1,
                    "type": "string"
                  },
                  "occurrenceId": {
                    "anyOf": [
                      {
                        "maxLength": 128,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "projectId": {
                    "maxLength": 128,
                    "pattern": "^[A-Za-z0-9_-]{1,128}$",
                    "type": "string"
                  },
                  "sessionId": {
                    "anyOf": [
                      {
                        "format": "uuid",
                        "maxLength": 36,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "setIndex": {
                    "anyOf": [
                      {
                        "format": "int32",
                        "maximum": 1000,
                        "minimum": 1,
                        "type": "integer"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "trainingId": {
                    "maxLength": 128,
                    "minLength": 1,
                    "type": "string"
                  }
                },
                "required": [
                  "exerciseId",
                  "occurrenceId",
                  "projectId",
                  "sessionId",
                  "setIndex",
                  "trainingId"
                ],
                "type": "object"
              }
            },
            "required": [
              "exerciseName",
              "replaces",
              "sourceVersion",
              "target"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "regional": {
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "occurrenceStartsAt": {
                "anyOf": [
                  {
                    "format": "date-time",
                    "type": "string"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "replaces": {
                "items": {
                  "type": "string"
                },
                "maxItems": 32,
                "type": "array"
              },
              "sourceVersion": {
                "maxLength": 64,
                "pattern": "^[a-f0-9]{64}$",
                "type": "string"
              },
              "target": {
                "additionalProperties": false,
                "properties": {
                  "occurrenceId": {
                    "anyOf": [
                      {
                        "maxLength": 256,
                        "minLength": 1,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "projectId": {
                    "maxLength": 128,
                    "pattern": "^[A-Za-z0-9_-]{1,128}$",
                    "type": "string"
                  },
                  "sessionId": {
                    "anyOf": [
                      {
                        "format": "uuid",
                        "maxLength": 36,
                        "minLength": 36,
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "targetType": {
                    "enum": [
                      "workout_occurrence"
                    ],
                    "type": "string"
                  },
                  "trainingId": {
                    "maxLength": 256,
                    "minLength": 1,
                    "type": "string"
                  }
                },
                "required": [
                  "occurrenceId",
                  "projectId",
                  "sessionId",
                  "targetType",
                  "trainingId"
                ],
                "type": "object"
              },
              "trainingName": {
                "maxLength": 200,
                "minLength": 1,
                "type": "string"
              }
            },
            "required": [
              "occurrenceStartsAt",
              "replaces",
              "sourceVersion",
              "target",
              "trainingName"
            ],
            "type": "object"
          },
          {
            "type": "null"
          }
        ]
      },
      "representationVersion": {
        "enum": [
          3
        ],
        "type": "integer"
      },
      "revision": {
        "anyOf": [
          {
            "maxLength": 64,
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "serverTime": {
        "format": "date-time",
        "type": "string"
      },
      "targetKind": {
        "enum": [
          "exercise",
          "regional"
        ],
        "type": "string"
      }
    },
    "required": [
      "entries",
      "epoch",
      "exercise",
      "regional",
      "representationVersion",
      "revision",
      "serverTime",
      "targetKind"
    ],
    "type": "object"
  },
  "RegionalPolicy": {
    "policyVersion": "1",
    "representationVersion": 3,
    "levels": [
      "low",
      "moderate",
      "high"
    ],
    "kind": {
      "key": "regional_emphasis",
      "effect": "focus",
      "objectives": [
        "regional_distribution"
      ],
      "targetTypes": [
        "workout_occurrence"
      ],
      "maxDurationMs": 604800000,
      "singleUse": false
    },
    "guidance": "A confirmed regional emphasis is a qualitative preference for one exact workout occurrence, never a dose or a measured distribution. The supplied state and dates apply only to that occurrence, never the whole programme. Scheduled is not active now, and an already confirmed instruction does not require confirmation again. low, moderate and high mean a light, moderate or important place in that workout, not percentages, extra sets, load, physiological effort or permission to train through pain. Null declares no temporary preference for that region: use a currently known durable preference or preserve unknown. A non-null region must already be explicitly included in the current durable configuration. Do not turn an excluded or unknown region into consent. Regional emphasis does not replace exercise interests or skips and does not identify muscles or regions from exercise names. Expiry, withdrawal and supersession never restore an older instruction or mutate a workout."
  }
};
