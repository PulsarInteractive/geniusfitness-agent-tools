// Generated from public TypeSpec exercise media DTOs. Do not edit by hand.
export default {
  "definitions": {
    "GeniusFitness.ExerciseMedia.Upload": {
      "additionalProperties": false,
      "properties": {
        "contentType": {
          "oneOf": [
            {
              "enum": [
                "image/png"
              ],
              "type": "string"
            },
            {
              "enum": [
                "image/jpeg"
              ],
              "type": "string"
            },
            {
              "enum": [
                "image/webp"
              ],
              "type": "string"
            }
          ]
        },
        "expectedEpoch": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "fileName": {
          "maxLength": 200,
          "minLength": 1,
          "type": "string"
        },
        "height": {
          "format": "int32",
          "maximum": 4096,
          "minimum": 1,
          "type": "integer"
        },
        "id": {
          "format": "uuid",
          "maxLength": 36,
          "type": "string"
        },
        "issuedAt": {
          "format": "int64",
          "minimum": 0,
          "type": "integer"
        },
        "sha256": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        },
        "size": {
          "format": "int32",
          "maximum": 15000000,
          "minimum": 1,
          "type": "integer"
        },
        "width": {
          "format": "int32",
          "maximum": 4096,
          "minimum": 1,
          "type": "integer"
        }
      },
      "required": [
        "contentType",
        "expectedEpoch",
        "fileName",
        "height",
        "id",
        "issuedAt",
        "sha256",
        "size",
        "width"
      ],
      "type": "object"
    },
    "GeniusFitness.ExerciseMedia.Image": {
      "additionalProperties": false,
      "properties": {
        "assetId": {
          "format": "uuid",
          "maxLength": 36,
          "type": "string"
        },
        "contentType": {
          "oneOf": [
            {
              "enum": [
                "image/png"
              ],
              "type": "string"
            },
            {
              "enum": [
                "image/jpeg"
              ],
              "type": "string"
            },
            {
              "enum": [
                "image/webp"
              ],
              "type": "string"
            }
          ]
        },
        "fileName": {
          "maxLength": 200,
          "minLength": 1,
          "type": "string"
        },
        "height": {
          "format": "int32",
          "maximum": 4096,
          "minimum": 1,
          "type": "integer"
        },
        "order": {
          "format": "int32",
          "maximum": 7,
          "minimum": 0,
          "type": "integer"
        },
        "size": {
          "format": "int32",
          "maximum": 15000000,
          "minimum": 1,
          "type": "integer"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "pending"
              ],
              "type": "string"
            },
            {
              "enum": [
                "ready"
              ],
              "type": "string"
            }
          ]
        },
        "width": {
          "format": "int32",
          "maximum": 4096,
          "minimum": 1,
          "type": "integer"
        }
      },
      "required": [
        "assetId",
        "contentType",
        "fileName",
        "height",
        "order",
        "size",
        "state",
        "width"
      ],
      "type": "object"
    },
    "GeniusFitness.ExerciseMedia.MediaCollection": {
      "additionalProperties": false,
      "properties": {
        "epoch": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "exerciseId": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "images": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.ExerciseMedia.Image"
          },
          "maxItems": 8,
          "type": "array"
        },
        "revision": {
          "maxLength": 128,
          "pattern": "^[0-9]+$",
          "type": "string"
        },
        "sequence": {
          "type": "boolean"
        }
      },
      "required": [
        "epoch",
        "exerciseId",
        "images",
        "revision",
        "sequence"
      ],
      "type": "object"
    },
    "GeniusFitness.ExerciseMedia.Session": {
      "additionalProperties": false,
      "properties": {
        "assetId": {
          "format": "uuid",
          "maxLength": 36,
          "type": "string"
        },
        "exerciseId": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "media": {
          "$ref": "#/$defs/GeniusFitness.ExerciseMedia.MediaCollection"
        },
        "readPath": {
          "maxLength": 512,
          "type": "string"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "pending"
              ],
              "type": "string"
            },
            {
              "enum": [
                "ready"
              ],
              "type": "string"
            },
            {
              "enum": [
                "removing"
              ],
              "type": "string"
            },
            {
              "enum": [
                "removed"
              ],
              "type": "string"
            }
          ]
        },
        "uploadPath": {
          "maxLength": 512,
          "type": "string"
        }
      },
      "required": [
        "assetId",
        "exerciseId",
        "media",
        "readPath",
        "state",
        "uploadPath"
      ],
      "type": "object"
    },
    "GeniusFitness.ExerciseMedia.Change": {
      "additionalProperties": false,
      "properties": {
        "action": {
          "oneOf": [
            {
              "enum": [
                "attach"
              ],
              "type": "string"
            },
            {
              "enum": [
                "detach"
              ],
              "type": "string"
            },
            {
              "enum": [
                "reorder"
              ],
              "type": "string"
            }
          ]
        },
        "assetId": {
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
        "assetIds": {
          "anyOf": [
            {
              "items": {
                "type": "string"
              },
              "maxItems": 8,
              "type": "array",
              "uniqueItems": true
            },
            {
              "type": "null"
            }
          ]
        },
        "expectedEpoch": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "expectedRevision": {
          "maxLength": 128,
          "pattern": "^[0-9]+$",
          "type": "string"
        },
        "issuedAt": {
          "format": "int64",
          "minimum": 0,
          "type": "integer"
        },
        "operationId": {
          "format": "uuid",
          "maxLength": 36,
          "type": "string"
        },
        "sequence": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "action",
        "expectedEpoch",
        "expectedRevision",
        "issuedAt",
        "operationId"
      ],
      "type": "object"
    },
    "GeniusFitness.ExerciseMediaHost.File": {
      "additionalProperties": false,
      "properties": {
        "download_url": {
          "maxLength": 4096,
          "minLength": 1,
          "type": "string"
        },
        "file_id": {
          "maxLength": 256,
          "minLength": 1,
          "type": "string"
        },
        "file_name": {
          "maxLength": 200,
          "minLength": 1,
          "type": "string"
        },
        "mime_type": {
          "maxLength": 100,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "download_url",
        "file_id"
      ],
      "type": "object"
    },
    "GeniusFitness.ExerciseMediaHost.Import": {
      "additionalProperties": false,
      "properties": {
        "expectedEpoch": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "file": {
          "$ref": "#/$defs/GeniusFitness.ExerciseMediaHost.File"
        },
        "id": {
          "format": "uuid",
          "maxLength": 36,
          "type": "string"
        },
        "issuedAt": {
          "format": "int64",
          "minimum": 0,
          "type": "integer"
        }
      },
      "required": [
        "expectedEpoch",
        "file",
        "id",
        "issuedAt"
      ],
      "type": "object"
    }
  }
};
