// Generated from the reviewed public subset of TypeSpec. Do not edit by hand.
export default {
  "maxCommandBytes": 131072,
  "commands": {
    "exercise.create": {
      "create": true,
      "fields": [
        "name",
        "catalogKey",
        "defaultRestSeconds",
        "defaultUnit",
        "equipment",
        "exerciseType",
        "icon",
        "muscleGroup",
        "notes",
        "section"
      ],
      "module": "LocalUser/LocalUserElement",
      "permission": "exercises:write"
    },
    "exercise.delete": {
      "delete": true,
      "fields": [],
      "module": "LocalUser/LocalUserElement",
      "permission": "exercises:write"
    },
    "exercise.document.create": {
      "create": true,
      "fields": [
        "element",
        "content"
      ],
      "module": "Project/SportExerciseDocument",
      "permission": "programs:write"
    },
    "exercise.document.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/SportExerciseDocument",
      "permission": "programs:write"
    },
    "exercise.document.update": {
      "fields": [
        "element",
        "content"
      ],
      "module": "Project/SportExerciseDocument",
      "permission": "programs:write"
    },
    "exercise.import": {
      "create": true,
      "fields": [
        "catalogKey",
        "defaultRestSeconds",
        "defaultUnit",
        "notes"
      ],
      "module": "LocalUser/LocalUserElement",
      "permission": "exercises:write",
      "requiredFields": [
        "catalogKey"
      ]
    },
    "exercise.update": {
      "fields": [
        "name",
        "catalogKey",
        "defaultRestSeconds",
        "defaultUnit",
        "equipment",
        "exerciseType",
        "icon",
        "muscleGroup",
        "notes",
        "section"
      ],
      "module": "LocalUser/LocalUserElement",
      "permission": "exercises:write"
    },
    "goal.create": {
      "create": true,
      "fields": [
        "title",
        "isTeamOwner",
        "owner",
        "taskNumber",
        "period",
        "interval",
        "startTime",
        "notification",
        "alertNotification",
        "scheduleTaskOnly"
      ],
      "module": "Project/ProjectMemberGoals",
      "permission": "planning:write"
    },
    "goal.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/ProjectMemberGoals",
      "permission": "planning:write"
    },
    "goal.update": {
      "fields": [
        "title",
        "isTeamOwner",
        "owner",
        "taskNumber",
        "period",
        "interval",
        "startTime",
        "notification",
        "alertNotification",
        "scheduleTaskOnly"
      ],
      "module": "Project/ProjectMemberGoals",
      "permission": "planning:write"
    },
    "health.create": {
      "create": true,
      "fields": [
        "at",
        "kind",
        "value",
        "unit",
        "site",
        "source",
        "sourceId",
        "details"
      ],
      "module": "LocalUser/LocalUserHealthLog",
      "permission": "health:write"
    },
    "health.delete": {
      "delete": true,
      "fields": [],
      "module": "LocalUser/LocalUserHealthLog",
      "permission": "health:write"
    },
    "health.update": {
      "fields": [
        "at",
        "kind",
        "value",
        "unit",
        "site",
        "source",
        "sourceId",
        "details"
      ],
      "module": "LocalUser/LocalUserHealthLog",
      "permission": "health:write"
    },
    "planning.create": {
      "create": true,
      "fields": [
        "title",
        "description",
        "training",
        "owner",
        "status",
        "type",
        "enableDueDate",
        "dueDate",
        "quantity",
        "quantityUnit",
        "archive",
        "autoArchive",
        "autoArchiveDays",
        "autoArchiveHours"
      ],
      "module": "Project/ProjectTask",
      "permission": "planning:write"
    },
    "planning.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/ProjectTask",
      "permission": "planning:write"
    },
    "planning.update": {
      "fields": [
        "title",
        "description",
        "training",
        "owner",
        "status",
        "type",
        "enableDueDate",
        "dueDate",
        "quantity",
        "quantityUnit",
        "archive",
        "autoArchive",
        "autoArchiveDays",
        "autoArchiveHours"
      ],
      "module": "Project/ProjectTask",
      "permission": "planning:write"
    },
    "program.create": {
      "create": true,
      "fields": [
        "title",
        "icon",
        "projectTimeZone"
      ],
      "module": "Project/$",
      "permission": "programs:write"
    },
    "program.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/$",
      "permission": "programs:write"
    },
    "program.update": {
      "fields": [
        "title",
        "icon",
        "projectTimeZone",
        "featureGoals",
        "featureScheduledTasks"
      ],
      "module": "Project/$",
      "permission": "programs:write"
    },
    "run.create": {
      "create": true,
      "fields": [
        "startedAt",
        "endedAt",
        "durationSeconds",
        "elapsedSeconds",
        "distanceMeters",
        "avgPaceSecPerKm",
        "elevationGainMeters",
        "splits",
        "polyline",
        "routeSegments",
        "source",
        "notes",
        "task"
      ],
      "module": "Project/SportRunLog",
      "permission": "metrics:write"
    },
    "run.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/SportRunLog",
      "permission": "metrics:write"
    },
    "run.update": {
      "fields": [
        "startedAt",
        "endedAt",
        "durationSeconds",
        "elapsedSeconds",
        "distanceMeters",
        "avgPaceSecPerKm",
        "elevationGainMeters",
        "splits",
        "polyline",
        "routeSegments",
        "source",
        "notes",
        "task"
      ],
      "module": "Project/SportRunLog",
      "permission": "metrics:write"
    },
    "schedule.create": {
      "create": true,
      "fields": [
        "title",
        "description",
        "training",
        "owner",
        "period",
        "interval",
        "weekDay",
        "startTime",
        "timeZoneId",
        "dueDateEnabled",
        "dueOffsetDays",
        "keepMissedOccurrences",
        "notification",
        "alertNotification",
        "dynamicTitle",
        "autoArchive",
        "autoArchiveDays",
        "autoArchiveHours"
      ],
      "module": "Project/ProjectScheduledTask",
      "permission": "planning:write"
    },
    "schedule.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/ProjectScheduledTask",
      "permission": "planning:write"
    },
    "schedule.update": {
      "fields": [
        "title",
        "description",
        "training",
        "owner",
        "period",
        "interval",
        "weekDay",
        "startTime",
        "timeZoneId",
        "dueDateEnabled",
        "dueOffsetDays",
        "keepMissedOccurrences",
        "notification",
        "alertNotification",
        "dynamicTitle",
        "autoArchive",
        "autoArchiveDays",
        "autoArchiveHours"
      ],
      "module": "Project/ProjectScheduledTask",
      "permission": "planning:write"
    },
    "session.create": {
      "create": true,
      "fields": [
        "startedAt",
        "endedAt",
        "durationSeconds",
        "training",
        "task",
        "performedSets",
        "notes"
      ],
      "module": "Project/SportSessionLog",
      "permission": "metrics:write"
    },
    "session.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/SportSessionLog",
      "permission": "metrics:write"
    },
    "session.update": {
      "fields": [
        "startedAt",
        "endedAt",
        "durationSeconds",
        "training",
        "task",
        "performedSets",
        "notes"
      ],
      "module": "Project/SportSessionLog",
      "permission": "metrics:write"
    },
    "workout.create": {
      "create": true,
      "fields": [
        "name",
        "description",
        "icon",
        "estimatedMinutes",
        "mode",
        "capMinutes"
      ],
      "module": "Project/SportTraining",
      "permission": "programs:write"
    },
    "workout.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/SportTraining",
      "permission": "programs:write"
    },
    "workout.exercise.create": {
      "create": true,
      "fields": [
        "training",
        "element",
        "targetSets",
        "restSeconds",
        "order"
      ],
      "module": "Project/SportTrainingExercise",
      "permission": "programs:write"
    },
    "workout.exercise.delete": {
      "delete": true,
      "fields": [],
      "module": "Project/SportTrainingExercise",
      "permission": "programs:write"
    },
    "workout.exercise.update": {
      "fields": [
        "training",
        "element",
        "targetSets",
        "restSeconds",
        "order"
      ],
      "module": "Project/SportTrainingExercise",
      "permission": "programs:write"
    },
    "workout.update": {
      "fields": [
        "name",
        "description",
        "icon",
        "estimatedMinutes",
        "mode",
        "capMinutes"
      ],
      "module": "Project/SportTraining",
      "permission": "programs:write"
    }
  },
  "collections": {
    "exerciseDocuments": {
      "fields": [
        "element",
        "content",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/SportExerciseDocument",
      "permission": "programs:read"
    },
    "exercises": {
      "fields": [
        "catalogKey",
        "defaultRestSeconds",
        "defaultUnit",
        "equipment",
        "exerciseType",
        "icon",
        "kind",
        "muscleGroup",
        "name",
        "notes",
        "section",
        "created",
        "updated"
      ],
      "module": "LocalUser/LocalUserElement",
      "permission": "exercises:read"
    },
    "goals": {
      "fields": [
        "title",
        "isTeamOwner",
        "owner",
        "disabled",
        "currentTaskNumber",
        "taskNumber",
        "period",
        "interval",
        "startTime",
        "created",
        "updated"
      ],
      "module": "Project/ProjectMemberGoals",
      "permission": "planning:read"
    },
    "health": {
      "fields": [
        "at",
        "kind",
        "value",
        "unit",
        "site",
        "source",
        "sourceId",
        "details",
        "created",
        "updated"
      ],
      "module": "LocalUser/LocalUserHealthLog",
      "permission": "health:read"
    },
    "members": {
      "fields": [
        "userId",
        "approved",
        "roles",
        "created",
        "updated"
      ],
      "module": "Project/ProjectMember",
      "permission": "programs:read"
    },
    "planning": {
      "fields": [
        "title",
        "description",
        "training",
        "owner",
        "status",
        "type",
        "enableDueDate",
        "dueDate",
        "quantity",
        "quantityUnit",
        "archive",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/ProjectTask",
      "permission": "planning:read"
    },
    "programs": {
      "fields": [
        "title",
        "icon",
        "projectTimeZone",
        "type",
        "featureGoals",
        "featureScheduledTasks",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/$",
      "permission": "programs:read"
    },
    "runs": {
      "fields": [
        "startedAt",
        "endedAt",
        "durationSeconds",
        "elapsedSeconds",
        "distanceMeters",
        "avgPaceSecPerKm",
        "elevationGainMeters",
        "splits",
        "polyline",
        "routeSegments",
        "source",
        "notes",
        "task",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/SportRunLog",
      "permission": "metrics:read"
    },
    "schedules": {
      "fields": [
        "title",
        "description",
        "training",
        "owner",
        "period",
        "interval",
        "weekDay",
        "startTime",
        "timeZoneId",
        "dueDateEnabled",
        "dueOffsetDays",
        "keepMissedOccurrences",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/ProjectScheduledTask",
      "permission": "planning:read"
    },
    "sessions": {
      "fields": [
        "startedAt",
        "endedAt",
        "durationSeconds",
        "training",
        "task",
        "performedSets",
        "notes",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/SportSessionLog",
      "permission": "metrics:read"
    },
    "workoutExercises": {
      "fields": [
        "training",
        "element",
        "targetSets",
        "restSeconds",
        "order",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/SportTrainingExercise",
      "permission": "programs:read"
    },
    "workouts": {
      "fields": [
        "name",
        "description",
        "icon",
        "estimatedMinutes",
        "mode",
        "capMinutes",
        "creator",
        "created",
        "updated"
      ],
      "module": "Project/SportTraining",
      "permission": "programs:read"
    }
  },
  "fieldSchemas": {
    "LocalUser/LocalUserElement": {
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100
      },
      "catalogKey": {
        "anyOf": [
          {
            "type": "string",
            "minLength": 0,
            "maxLength": 60
          },
          {
            "type": "null"
          }
        ]
      },
      "defaultRestSeconds": {
        "default": 90,
        "format": "int32",
        "type": "integer"
      },
      "defaultUnit": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 20
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "equipment": {
        "anyOf": [
          {
            "type": "string",
            "minLength": 0,
            "maxLength": 60
          },
          {
            "type": "null"
          }
        ]
      },
      "exerciseType": {
        "anyOf": [
          {
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
          {
            "type": "null"
          }
        ]
      },
      "icon": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 80
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "muscleGroup": {
        "anyOf": [
          {
            "enum": [
              "Chest",
              "Back",
              "Shoulders",
              "Arms",
              "Legs",
              "Core",
              "FullBody",
              "Cardio",
              "Other"
            ],
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "notes": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 200
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "section": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 40
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      }
    },
    "Project/SportExerciseDocument": {
      "element": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "content": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 32000
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      }
    },
    "Project/ProjectMemberGoals": {
      "title": {
        "type": "string",
        "minLength": 3,
        "maxLength": 100
      },
      "isTeamOwner": {
        "default": true,
        "type": "boolean"
      },
      "owner": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "taskNumber": {
        "default": 1,
        "format": "int32",
        "type": "integer"
      },
      "period": {
        "anyOf": [
          {
            "enum": [
              "Weekly",
              "Monthly"
            ],
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "interval": {
        "default": 28,
        "format": "int32",
        "type": "integer"
      },
      "startTime": {
        "format": "date-time",
        "type": "string"
      },
      "notification": {
        "default": true,
        "type": "boolean"
      },
      "alertNotification": {
        "default": true,
        "type": "boolean"
      },
      "scheduleTaskOnly": {
        "default": false,
        "type": "boolean"
      }
    },
    "LocalUser/LocalUserHealthLog": {
      "at": {
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
              "Weight",
              "BodyFat",
              "Measurement",
              "RestingHeartRate",
              "Steps"
            ],
            "type": "string",
            "default": "Weight"
          },
          {
            "type": "null"
          }
        ],
        "default": "Weight"
      },
      "value": {
        "anyOf": [
          {
            "format": "double",
            "type": "number"
          },
          {
            "type": "null"
          }
        ]
      },
      "unit": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 20
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "site": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 40
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "source": {
        "anyOf": [
          {
            "enum": [
              "Manual",
              "HealthKit",
              "HealthConnect"
            ],
            "type": "string",
            "default": "Manual"
          },
          {
            "type": "null"
          }
        ],
        "default": "Manual"
      },
      "sourceId": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 80
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "details": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 2000
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      }
    },
    "Project/ProjectTask": {
      "title": {
        "type": "string",
        "minLength": 3,
        "maxLength": 200
      },
      "description": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 600
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "training": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "owner": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "anyOf": [
          {
            "enum": [
              "New",
              "InProgress",
              "Done"
            ],
            "type": "string",
            "default": "New"
          },
          {
            "type": "null"
          }
        ],
        "default": "New"
      },
      "type": {
        "anyOf": [
          {
            "enum": [
              "Task",
              "Critical",
              "NewFeature",
              "Question"
            ],
            "type": "string",
            "default": "Task"
          },
          {
            "type": "null"
          }
        ],
        "default": "Task"
      },
      "enableDueDate": {
        "default": false,
        "type": "boolean"
      },
      "dueDate": {
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
      "quantity": {
        "anyOf": [
          {
            "format": "double",
            "type": "number"
          },
          {
            "type": "null"
          }
        ]
      },
      "quantityUnit": {
        "anyOf": [
          {
            "type": "string",
            "minLength": 0,
            "maxLength": 20
          },
          {
            "type": "null"
          }
        ]
      },
      "archive": {
        "anyOf": [
          {
            "default": false,
            "type": "boolean"
          },
          {
            "type": "null"
          }
        ],
        "default": false
      },
      "autoArchive": {
        "default": false,
        "type": "boolean"
      },
      "autoArchiveDays": {
        "default": 14,
        "format": "int32",
        "type": "integer"
      },
      "autoArchiveHours": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      }
    },
    "Project/$": {
      "title": {
        "type": "string",
        "minLength": 3,
        "maxLength": 100
      },
      "icon": {
        "type": "string",
        "minLength": 3,
        "maxLength": 512
      },
      "projectTimeZone": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "featureGoals": {
        "anyOf": [
          {
            "default": true,
            "type": "boolean"
          },
          {
            "type": "null"
          }
        ],
        "default": true
      },
      "featureScheduledTasks": {
        "anyOf": [
          {
            "default": true,
            "type": "boolean"
          },
          {
            "type": "null"
          }
        ],
        "default": true
      }
    },
    "Project/SportRunLog": {
      "startedAt": {
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
      "endedAt": {
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
      "durationSeconds": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      },
      "elapsedSeconds": {
        "anyOf": [
          {
            "format": "int32",
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "distanceMeters": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      },
      "avgPaceSecPerKm": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      },
      "elevationGainMeters": {
        "anyOf": [
          {
            "format": "int32",
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "splits": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 32000
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "polyline": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 16000
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "routeSegments": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 16000
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "source": {
        "anyOf": [
          {
            "enum": [
              "Gps",
              "Manual"
            ],
            "type": "string",
            "default": "Gps"
          },
          {
            "type": "null"
          }
        ],
        "default": "Gps"
      },
      "notes": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 400
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "task": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      }
    },
    "Project/ProjectScheduledTask": {
      "title": {
        "type": "string",
        "minLength": 3,
        "maxLength": 100
      },
      "description": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 400
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "training": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "owner": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "period": {
        "anyOf": [
          {
            "enum": [
              "Weekly",
              "Monthly"
            ],
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "interval": {
        "default": 7,
        "format": "int32",
        "type": "integer"
      },
      "weekDay": {
        "anyOf": [
          {
            "enum": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "startTime": {
        "format": "date-time",
        "type": "string"
      },
      "timeZoneId": {
        "anyOf": [
          {
            "type": "string",
            "minLength": 0,
            "maxLength": 64
          },
          {
            "type": "null"
          }
        ]
      },
      "dueDateEnabled": {
        "default": false,
        "type": "boolean"
      },
      "dueOffsetDays": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      },
      "keepMissedOccurrences": {
        "default": false,
        "type": "boolean"
      },
      "notification": {
        "default": true,
        "type": "boolean"
      },
      "alertNotification": {
        "default": true,
        "type": "boolean"
      },
      "dynamicTitle": {
        "default": false,
        "type": "boolean"
      },
      "autoArchive": {
        "default": true,
        "type": "boolean"
      },
      "autoArchiveDays": {
        "default": 14,
        "format": "int32",
        "type": "integer"
      },
      "autoArchiveHours": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      }
    },
    "Project/SportSessionLog": {
      "startedAt": {
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
      "endedAt": {
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
      "durationSeconds": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      },
      "training": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "task": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "performedSets": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 16000
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "notes": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 400
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      }
    },
    "Project/SportTraining": {
      "name": {
        "type": "string",
        "minLength": 3,
        "maxLength": 100
      },
      "description": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 400
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "icon": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 80
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "estimatedMinutes": {
        "default": 60,
        "format": "int32",
        "type": "integer"
      },
      "mode": {
        "anyOf": [
          {
            "enum": [
              "Sets",
              "Amrap"
            ],
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "capMinutes": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      }
    },
    "Project/SportTrainingExercise": {
      "training": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "element": {
        "anyOf": [
          {
            "default": "",
            "type": "string",
            "minLength": 0,
            "maxLength": 40
          },
          {
            "type": "null"
          }
        ],
        "default": ""
      },
      "targetSets": {
        "type": "string",
        "minLength": 2,
        "maxLength": 4000
      },
      "restSeconds": {
        "default": 90,
        "format": "int32",
        "type": "integer"
      },
      "order": {
        "default": 0,
        "format": "int32",
        "type": "integer"
      }
    }
  },
  "changes": {
    "pollIntervalSeconds": 5,
    "maxWatchSeconds": 60
  },
  "grants": {
    "permissions": [
      "programs:read",
      "programs:write",
      "exercises:read",
      "exercises:write",
      "planning:read",
      "planning:write",
      "metrics:read",
      "metrics:write",
      "health:read",
      "health:write",
      "coaching:write"
    ],
    "maxResources": 200,
    "maxProfilesPerConnection": 20
  }
};
