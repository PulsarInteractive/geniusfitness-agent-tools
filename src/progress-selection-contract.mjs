// Generated from public TypeSpec progress-selection DTOs. Do not edit by hand.
export default {
  "roots": {
    "request": "GeniusFitness.AgentSelectedProgress.Request",
    "result": "GeniusFitness.AgentSelectedProgress.Result"
  },
  "definitions": {
    "GeniusFitness.AgentSelectedProgress.Request": {
      "additionalProperties": false,
      "properties": {
        "scope": {
          "maxLength": 136,
          "pattern": "^project:[A-Za-z0-9_-]{1,128}$",
          "type": "string"
        },
        "selection": {
          "$ref": "#/$defs/GeniusFitness.AgentSelectedProgress.Selection"
        }
      },
      "required": [
        "scope",
        "selection"
      ],
      "type": "object"
    },
    "GeniusFitness.AgentSelectedProgress.Result": {
      "additionalProperties": false,
      "properties": {
        "accountHistoryComplete": {
          "enum": [
            false
          ],
          "type": "boolean"
        },
        "asOf": {
          "format": "date-time",
          "type": "string"
        },
        "availableFrom": {
          "format": "date",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
          "type": "string"
        },
        "checkpoint": {
          "maxLength": 64,
          "minLength": 1,
          "type": "string"
        },
        "comparisonAvailable": {
          "enum": [
            false
          ],
          "type": "boolean"
        },
        "epoch": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "latestSession": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CoachSelectedProgress.CoachSelectedProgressSession"
            },
            {
              "type": "null"
            }
          ]
        },
        "latestSessionUnavailableReason": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CoachSelectedProgress.CoachSelectedProgressUnavailableReason"
            },
            {
              "type": "null"
            }
          ]
        },
        "periods": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CoachTimeline.Week"
          },
          "maxItems": 4,
          "type": "array"
        },
        "physiologicalProgressEstablished": {
          "enum": [
            false
          ],
          "type": "boolean"
        },
        "progressionAdviceAvailable": {
          "enum": [
            false
          ],
          "type": "boolean"
        },
        "running": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CoachSelectedProgress.CoachSelectedProgressRuns"
            },
            {
              "type": "null"
            }
          ]
        },
        "scope": {
          "maxLength": 136,
          "pattern": "^project:[A-Za-z0-9_-]{1,128}$",
          "type": "string"
        },
        "selection": {
          "$ref": "#/$defs/GeniusFitness.AgentSelectedProgress.Selection"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "ready"
              ],
              "type": "string"
            },
            {
              "enum": [
                "insufficient_data"
              ],
              "type": "string"
            }
          ]
        },
        "subjectId": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "timeZone": {
          "maxLength": 100,
          "minLength": 1,
          "type": "string"
        },
        "windowFrom": {
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
        "windowUntil": {
          "anyOf": [
            {
              "format": "date-time",
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "accountHistoryComplete",
        "asOf",
        "availableFrom",
        "checkpoint",
        "comparisonAvailable",
        "epoch",
        "latestSession",
        "latestSessionUnavailableReason",
        "periods",
        "physiologicalProgressEstablished",
        "progressionAdviceAvailable",
        "running",
        "scope",
        "selection",
        "state",
        "subjectId",
        "timeZone",
        "windowFrom",
        "windowUntil"
      ],
      "type": "object"
    },
    "GeniusFitness.AgentSelectedProgress.Selection": {
      "enum": [
        "last_7_days",
        "last_28_days",
        "latest_training_session"
      ],
      "type": "string"
    },
    "GeniusFitness.CoachProgressBriefing.CoachProgressRunSource": {
      "enum": [
        "Gps",
        "Manual"
      ],
      "type": "string"
    },
    "GeniusFitness.CoachProgressBriefing.CoachProgressRunTerrain": {
      "enum": [
        "Road",
        "Trail",
        "Track",
        "Treadmill",
        "Mixed"
      ],
      "type": "string"
    },
    "GeniusFitness.CoachRunProgress.CoachRunProgressObservation": {
      "additionalProperties": false,
      "properties": {
        "distanceMeters": {
          "format": "int32",
          "maximum": 2000000,
          "minimum": 0,
          "type": "integer"
        },
        "durationSeconds": {
          "format": "int32",
          "maximum": 86400,
          "minimum": 1,
          "type": "integer"
        },
        "endedAt": {
          "format": "date-time",
          "maxLength": 40,
          "type": "string"
        },
        "perceivedEffort": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 10,
              "minimum": 0,
              "type": "integer"
            },
            {
              "type": "null"
            }
          ]
        },
        "recordedSource": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CoachProgressBriefing.CoachProgressRunSource"
            },
            {
              "type": "null"
            }
          ]
        },
        "runId": {
          "maxLength": 200,
          "minLength": 1,
          "type": "string"
        },
        "startedAt": {
          "format": "date-time",
          "maxLength": 40,
          "type": "string"
        },
        "terrain": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CoachProgressBriefing.CoachProgressRunTerrain"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "distanceMeters",
        "durationSeconds",
        "endedAt",
        "perceivedEffort",
        "recordedSource",
        "runId",
        "startedAt",
        "terrain"
      ],
      "type": "object"
    },
    "GeniusFitness.CoachSelectedProgress.CoachSelectedProgressRuns": {
      "additionalProperties": false,
      "properties": {
        "candidatePageComplete": {
          "type": "boolean"
        },
        "examinedRecords": {
          "format": "int32",
          "maximum": 50,
          "minimum": 0,
          "type": "integer"
        },
        "observations": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CoachRunProgress.CoachRunProgressObservation"
          },
          "maxItems": 4,
          "type": "array"
        },
        "observationsComplete": {
          "type": "boolean"
        },
        "omittedObservations": {
          "format": "int32",
          "maximum": 50,
          "minimum": 0,
          "type": "integer"
        },
        "selection": {
          "enum": [
            "bounded_id_page"
          ],
          "type": "string"
        },
        "windowComplete": {
          "type": "boolean"
        }
      },
      "required": [
        "candidatePageComplete",
        "examinedRecords",
        "observations",
        "observationsComplete",
        "omittedObservations",
        "selection",
        "windowComplete"
      ],
      "type": "object"
    },
    "GeniusFitness.CoachSelectedProgress.CoachSelectedProgressSession": {
      "additionalProperties": false,
      "properties": {
        "completedSets": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        },
        "correctedSets": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        },
        "elapsedIncludesPauses": {
          "enum": [
            true
          ],
          "type": "boolean"
        },
        "elapsedSeconds": {
          "format": "double",
          "minimum": 0,
          "type": "number"
        },
        "endedAt": {
          "format": "date-time",
          "type": "string"
        },
        "observedExerciseCount": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        },
        "sessionId": {
          "maxLength": 200,
          "minLength": 1,
          "type": "string"
        },
        "skippedSets": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        },
        "startedAt": {
          "format": "date-time",
          "type": "string"
        },
        "totalSets": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        },
        "trainingId": {
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
        "unfinishedSets": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        },
        "workingSets": {
          "format": "int32",
          "maximum": 80,
          "minimum": 0,
          "type": "integer"
        }
      },
      "required": [
        "completedSets",
        "correctedSets",
        "elapsedIncludesPauses",
        "elapsedSeconds",
        "endedAt",
        "observedExerciseCount",
        "sessionId",
        "skippedSets",
        "startedAt",
        "totalSets",
        "trainingId",
        "unfinishedSets",
        "workingSets"
      ],
      "type": "object"
    },
    "GeniusFitness.CoachSelectedProgress.CoachSelectedProgressUnavailableReason": {
      "enum": [
        "none_retained",
        "invalid_latest_record",
        "observations_unavailable"
      ],
      "type": "string"
    },
    "GeniusFitness.CoachTimeline.Week": {
      "additionalProperties": false,
      "properties": {
        "activeDays": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 7,
              "minimum": 0,
              "type": "integer"
            },
            {
              "type": "null"
            }
          ]
        },
        "capped": {
          "type": "boolean"
        },
        "closed": {
          "type": "boolean"
        },
        "coverage": {
          "oneOf": [
            {
              "enum": [
                "complete"
              ],
              "type": "string"
            },
            {
              "enum": [
                "partial"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unavailable"
              ],
              "type": "string"
            }
          ]
        },
        "examinedRecords": {
          "format": "int32",
          "maximum": 16,
          "minimum": 0,
          "type": "integer"
        },
        "exampleSessionIds": {
          "items": {
            "type": "string"
          },
          "maxItems": 2,
          "type": "array",
          "uniqueItems": true
        },
        "from": {
          "format": "date-time",
          "type": "string"
        },
        "observedSessionsWithWork": {
          "format": "int32",
          "maximum": 16,
          "minimum": 0,
          "type": "integer"
        },
        "observedThrough": {
          "format": "date-time",
          "type": "string"
        },
        "observedTrainingDays": {
          "items": {
            "type": "string"
          },
          "maxItems": 7,
          "type": "array",
          "uniqueItems": true
        },
        "observedWorkingSets": {
          "format": "int32",
          "maximum": 1280,
          "minimum": 0,
          "type": "integer"
        },
        "omittedRecords": {
          "format": "int32",
          "maximum": 16,
          "minimum": 0,
          "type": "integer"
        },
        "sessionsWithWork": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 16,
              "minimum": 0,
              "type": "integer"
            },
            {
              "type": "null"
            }
          ]
        },
        "until": {
          "format": "date-time",
          "type": "string"
        },
        "workingSets": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 1280,
              "minimum": 0,
              "type": "integer"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "activeDays",
        "capped",
        "closed",
        "coverage",
        "examinedRecords",
        "exampleSessionIds",
        "from",
        "observedSessionsWithWork",
        "observedThrough",
        "observedTrainingDays",
        "observedWorkingSets",
        "omittedRecords",
        "sessionsWithWork",
        "until",
        "workingSets"
      ],
      "type": "object"
    }
  }
};
