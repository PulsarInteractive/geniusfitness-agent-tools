// Generated from the reviewed public TypeSpec read schemas. Do not edit by hand.
export default {
  "roots": {
    "query": "GeniusFitness.CatalogueReviewedRead.V1.CatalogueReviewedReadQuery",
    "page": "GeniusFitness.CatalogueReviewedRead.V1.CatalogueReviewedReadPage",
    "detail": "GeniusFitness.CatalogueAdmission.V1.CatalogueReviewedSubsetDetail"
  },
  "definitions": {
    "GeniusFitness.CatalogueAdmission.V1.CatalogueReviewedSubsetDetail": {
      "additionalProperties": false,
      "properties": {
        "coverage": {
          "enum": [
            "partial"
          ],
          "type": "string"
        },
        "equipment": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentDefinition"
          },
          "maxItems": 256,
          "type": "array"
        },
        "family": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Family"
            },
            {
              "type": "null"
            }
          ]
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
        "sources": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Source"
          },
          "maxItems": 2000,
          "type": "array"
        },
        "subsetVersion": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        },
        "variant": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Variant"
        }
      },
      "required": [
        "coverage",
        "equipment",
        "family",
        "qualification",
        "sourceContentVersion",
        "sources",
        "subsetVersion",
        "variant"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueAdmission.V1.CatalogueReviewedSubsetPage": {
      "additionalProperties": false,
      "properties": {
        "coverage": {
          "enum": [
            "partial"
          ],
          "type": "string"
        },
        "page": {
          "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.Page"
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
        }
      },
      "required": [
        "coverage",
        "page",
        "qualification",
        "sourceContentVersion",
        "subsetVersion"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Alternative": {
      "additionalProperties": false,
      "properties": {
        "catalogueKey": {
          "maxLength": 100,
          "minLength": 1,
          "type": "string"
        },
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "reason": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "catalogueKey",
        "evidence",
        "reason"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Contradictions": {
      "additionalProperties": false,
      "properties": {
        "note": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "sourceIds": {
          "items": {
            "maxLength": 80,
            "minLength": 1,
            "type": "string"
          },
          "maxItems": 8,
          "type": "array",
          "uniqueItems": true
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "not_assessed"
              ],
              "type": "string"
            },
            {
              "enum": [
                "none_identified"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unresolved"
              ],
              "type": "string"
            },
            {
              "enum": [
                "resolved_with_limits"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "note",
        "sourceIds",
        "state"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Cue": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "known"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        },
        "text": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "evidence",
        "state",
        "text"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.EquipmentClause": {
      "additionalProperties": false,
      "properties": {
        "anyOf": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentSetup"
          },
          "maxItems": 4,
          "minItems": 1,
          "type": "array"
        }
      },
      "required": [
        "anyOf"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.EquipmentDefinition": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "id": {
          "maxLength": 80,
          "minLength": 1,
          "pattern": "^[a-z0-9][a-z0-9._-]*$",
          "type": "string"
        },
        "inventoryKind": {
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
        "label": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
        },
        "parentId": {
          "anyOf": [
            {
              "maxLength": 80,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "precision": {
          "oneOf": [
            {
              "enum": [
                "category"
              ],
              "type": "string"
            },
            {
              "enum": [
                "specific"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "evidence",
        "id",
        "inventoryKind",
        "label",
        "parentId",
        "precision"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.EquipmentItem": {
      "additionalProperties": false,
      "properties": {
        "equipmentId": {
          "maxLength": 80,
          "minLength": 1,
          "type": "string"
        },
        "quantity": {
          "format": "int32",
          "maximum": 16,
          "minimum": 1,
          "type": "integer"
        }
      },
      "required": [
        "equipmentId",
        "quantity"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.EquipmentRequirements": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "optional": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentSetup"
          },
          "maxItems": 8,
          "type": "array"
        },
        "required": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentClause"
          },
          "maxItems": 8,
          "type": "array"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "none"
              ],
              "type": "string"
            },
            {
              "enum": [
                "known"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "evidence",
        "optional",
        "required",
        "state"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.EquipmentSetup": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "items": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentItem"
          },
          "maxItems": 8,
          "minItems": 1,
          "type": "array"
        }
      },
      "required": [
        "evidence",
        "items"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Evidence": {
      "additionalProperties": false,
      "properties": {
        "basis": {
          "oneOf": [
            {
              "enum": [
                "documented_attribution"
              ],
              "type": "string"
            },
            {
              "enum": [
                "manufacturer_requirement"
              ],
              "type": "string"
            },
            {
              "enum": [
                "mechanical_description"
              ],
              "type": "string"
            },
            {
              "enum": [
                "editorial_cue"
              ],
              "type": "string"
            },
            {
              "enum": [
                "synthetic_fixture"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        },
        "limitations": {
          "items": {
            "maxLength": 400,
            "minLength": 1,
            "type": "string"
          },
          "maxItems": 8,
          "minItems": 1,
          "type": "array"
        },
        "method": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "preparedBy": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        },
        "review": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Review"
            },
            {
              "type": "null"
            }
          ]
        },
        "sourceIds": {
          "items": {
            "maxLength": 80,
            "minLength": 1,
            "type": "string"
          },
          "maxItems": 8,
          "type": "array",
          "uniqueItems": true
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unreviewed"
              ],
              "type": "string"
            },
            {
              "enum": [
                "reviewed"
              ],
              "type": "string"
            },
            {
              "enum": [
                "synthetic"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "basis",
        "limitations",
        "method",
        "preparedBy",
        "review",
        "sourceIds",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.ExperimentalContext": {
      "additionalProperties": false,
      "properties": {
        "comparison": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "measurement": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "observedOutcome": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "population": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "protocol": {
          "maxLength": 1200,
          "minLength": 1,
          "type": "string"
        },
        "transferLimits": {
          "items": {
            "maxLength": 400,
            "minLength": 1,
            "type": "string"
          },
          "maxItems": 8,
          "minItems": 1,
          "type": "array"
        }
      },
      "required": [
        "comparison",
        "measurement",
        "observedOutcome",
        "population",
        "protocol",
        "transferLimits"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Explanation": {
      "additionalProperties": false,
      "properties": {
        "breathing": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
          },
          "maxItems": 8,
          "type": "array"
        },
        "cautions": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
          },
          "maxItems": 8,
          "type": "array"
        },
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "execution": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
          },
          "maxItems": 12,
          "type": "array"
        },
        "setup": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
          },
          "maxItems": 12,
          "type": "array"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "known"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "breathing",
        "cautions",
        "evidence",
        "execution",
        "setup",
        "state"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Family": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "id": {
          "maxLength": 100,
          "minLength": 1,
          "pattern": "^[a-z0-9][a-z0-9._-]*$",
          "type": "string"
        },
        "label": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
        },
        "mechanicalProximity": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "evidence",
        "id",
        "label",
        "mechanicalProximity"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Media": {
      "additionalProperties": false,
      "properties": {
        "assetKey": {
          "anyOf": [
            {
              "maxLength": 160,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "sha256": {
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
        "state": {
          "oneOf": [
            {
              "enum": [
                "reference"
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
        }
      },
      "required": [
        "assetKey",
        "evidence",
        "sha256",
        "state"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.MuscleAttribution": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "known"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        },
        "targets": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.MuscleTarget"
          },
          "maxItems": 17,
          "type": "array"
        }
      },
      "required": [
        "evidence",
        "state",
        "targets"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.MuscleMethodology": {
      "additionalProperties": false,
      "properties": {
        "contradictions": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Contradictions"
        },
        "experimental": {
          "anyOf": [
            {
              "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.ExperimentalContext"
            },
            {
              "type": "null"
            }
          ]
        },
        "interpretation": {
          "oneOf": [
            {
              "enum": [
                "qualitative_involvement"
              ],
              "type": "string"
            },
            {
              "enum": [
                "protocol_observation"
              ],
              "type": "string"
            }
          ]
        },
        "kind": {
          "oneOf": [
            {
              "enum": [
                "anatomical_role"
              ],
              "type": "string"
            },
            {
              "enum": [
                "qualitative_inference"
              ],
              "type": "string"
            },
            {
              "enum": [
                "editorial_estimate"
              ],
              "type": "string"
            },
            {
              "enum": [
                "experimental_measurement"
              ],
              "type": "string"
            }
          ]
        },
        "scope": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "sourceLocators": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.SourceLocator"
          },
          "maxItems": 8,
          "minItems": 1,
          "type": "array"
        },
        "version": {
          "enum": [
            "muscle-attribution-v1"
          ],
          "type": "string"
        }
      },
      "required": [
        "contradictions",
        "experimental",
        "interpretation",
        "kind",
        "scope",
        "sourceLocators",
        "version"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.MuscleTarget": {
      "additionalProperties": false,
      "properties": {
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "methodology": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.MuscleMethodology"
        },
        "role": {
          "oneOf": [
            {
              "enum": [
                "primary"
              ],
              "type": "string"
            },
            {
              "enum": [
                "secondary"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unspecified"
              ],
              "type": "string"
            }
          ]
        },
        "targetId": {
          "maxLength": 80,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "evidence",
        "methodology",
        "role",
        "targetId"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Review": {
      "additionalProperties": false,
      "properties": {
        "claimDigest": {
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
        "reviewedAt": {
          "format": "date-time",
          "type": "string"
        },
        "reviewer": {
          "maxLength": 128,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "claimDigest",
        "reviewedAt",
        "reviewer"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Source": {
      "additionalProperties": false,
      "properties": {
        "access": {
          "oneOf": [
            {
              "enum": [
                "full_text"
              ],
              "type": "string"
            },
            {
              "enum": [
                "abstract_only"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_accessed"
              ],
              "type": "string"
            },
            {
              "enum": [
                "synthetic"
              ],
              "type": "string"
            }
          ]
        },
        "accessNote": {
          "maxLength": 400,
          "minLength": 1,
          "type": "string"
        },
        "accessedAt": {
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
        "documentType": {
          "oneOf": [
            {
              "enum": [
                "experimental_study"
              ],
              "type": "string"
            },
            {
              "enum": [
                "anatomy_reference"
              ],
              "type": "string"
            },
            {
              "enum": [
                "technical_guide"
              ],
              "type": "string"
            },
            {
              "enum": [
                "methodology"
              ],
              "type": "string"
            },
            {
              "enum": [
                "dataset"
              ],
              "type": "string"
            },
            {
              "enum": [
                "editorial_record"
              ],
              "type": "string"
            },
            {
              "enum": [
                "synthetic"
              ],
              "type": "string"
            }
          ]
        },
        "id": {
          "maxLength": 80,
          "minLength": 1,
          "pattern": "^[a-z0-9][a-z0-9._-]*$",
          "type": "string"
        },
        "kind": {
          "oneOf": [
            {
              "enum": [
                "primary_reference"
              ],
              "type": "string"
            },
            {
              "enum": [
                "manufacturer"
              ],
              "type": "string"
            },
            {
              "enum": [
                "dataset"
              ],
              "type": "string"
            },
            {
              "enum": [
                "editorial"
              ],
              "type": "string"
            },
            {
              "enum": [
                "synthetic"
              ],
              "type": "string"
            }
          ]
        },
        "limitations": {
          "items": {
            "maxLength": 400,
            "minLength": 1,
            "type": "string"
          },
          "maxItems": 8,
          "type": "array"
        },
        "rights": {
          "maxLength": 400,
          "minLength": 1,
          "type": "string"
        },
        "title": {
          "maxLength": 240,
          "minLength": 1,
          "type": "string"
        },
        "url": {
          "anyOf": [
            {
              "maxLength": 2000,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "access",
        "accessNote",
        "accessedAt",
        "documentType",
        "id",
        "kind",
        "limitations",
        "rights",
        "title",
        "url"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.SourceLocator": {
      "additionalProperties": false,
      "properties": {
        "locator": {
          "maxLength": 400,
          "minLength": 1,
          "type": "string"
        },
        "sourceId": {
          "maxLength": 80,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "locator",
        "sourceId"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Text": {
      "additionalProperties": false,
      "properties": {
        "en": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        },
        "fr": {
          "maxLength": 600,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "en",
        "fr"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.Variant": {
      "additionalProperties": false,
      "properties": {
        "alternatives": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Alternative"
          },
          "maxItems": 8,
          "type": "array"
        },
        "axes": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.VariantAxis"
          },
          "maxItems": 7,
          "minItems": 7,
          "type": "array"
        },
        "catalogueKey": {
          "maxLength": 100,
          "pattern": "^(ex\\.[0-9]+|fixture\\.[a-z0-9-]+)$",
          "type": "string"
        },
        "cue": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Cue"
        },
        "equipment": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentRequirements"
        },
        "explanation": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Explanation"
        },
        "familyId": {
          "anyOf": [
            {
              "maxLength": 100,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "label": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Text"
        },
        "loadConvention": {
          "oneOf": [
            {
              "enum": [
                "total"
              ],
              "type": "string"
            },
            {
              "enum": [
                "perImplement"
              ],
              "type": "string"
            },
            {
              "enum": [
                "perSide"
              ],
              "type": "string"
            },
            {
              "enum": [
                "bodyweight"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        },
        "loadEvidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "media": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Media"
        },
        "muscles": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.MuscleAttribution"
        },
        "visibility": {
          "oneOf": [
            {
              "enum": [
                "browse"
              ],
              "type": "string"
            },
            {
              "enum": [
                "search_only"
              ],
              "type": "string"
            },
            {
              "enum": [
                "retained"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "alternatives",
        "axes",
        "catalogueKey",
        "cue",
        "equipment",
        "explanation",
        "familyId",
        "label",
        "loadConvention",
        "loadEvidence",
        "media",
        "muscles",
        "visibility"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueFoundation.V1.VariantAxis": {
      "additionalProperties": false,
      "properties": {
        "axis": {
          "oneOf": [
            {
              "enum": [
                "gripOrientation"
              ],
              "type": "string"
            },
            {
              "enum": [
                "gripWidth"
              ],
              "type": "string"
            },
            {
              "enum": [
                "bodyPosition"
              ],
              "type": "string"
            },
            {
              "enum": [
                "benchAngle"
              ],
              "type": "string"
            },
            {
              "enum": [
                "laterality"
              ],
              "type": "string"
            },
            {
              "enum": [
                "stanceWidth"
              ],
              "type": "string"
            },
            {
              "enum": [
                "movementOrientation"
              ],
              "type": "string"
            }
          ]
        },
        "evidence": {
          "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Evidence"
        },
        "state": {
          "oneOf": [
            {
              "enum": [
                "known"
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
                "not_applicable"
              ],
              "type": "string"
            }
          ]
        },
        "value": {
          "anyOf": [
            {
              "maxLength": 40,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "axis",
        "evidence",
        "state",
        "value"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.ClauseResult": {
      "additionalProperties": false,
      "properties": {
        "alternatives": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.SetupResult"
          },
          "maxItems": 4,
          "type": "array"
        },
        "matchedAlternative": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 3,
              "minimum": 0,
              "type": "integer"
            },
            {
              "type": "null"
            }
          ]
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "alternatives",
        "matchedAlternative",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.EquipmentResult": {
      "additionalProperties": false,
      "properties": {
        "clauses": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.ClauseResult"
          },
          "maxItems": 8,
          "type": "array"
        },
        "evidenceStatus": {
          "oneOf": [
            {
              "enum": [
                "declared_reviewed"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unreviewed"
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
                "synthetic"
              ],
              "type": "string"
            }
          ]
        },
        "optional": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.SetupResult"
          },
          "maxItems": 8,
          "type": "array"
        },
        "reason": {
          "oneOf": [
            {
              "enum": [
                "no_required_equipment"
              ],
              "type": "string"
            },
            {
              "enum": [
                "requirements_satisfied"
              ],
              "type": "string"
            },
            {
              "enum": [
                "requirements_missing"
              ],
              "type": "string"
            },
            {
              "enum": [
                "requirements_unknown"
              ],
              "type": "string"
            },
            {
              "enum": [
                "inventory_insufficiently_known"
              ],
              "type": "string"
            },
            {
              "enum": [
                "overlapping_required_clauses"
              ],
              "type": "string"
            },
            {
              "enum": [
                "overlapping_required_items"
              ],
              "type": "string"
            }
          ]
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "clauses",
        "evidenceStatus",
        "optional",
        "reason",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.Inventory": {
      "additionalProperties": false,
      "properties": {
        "coverage": {
          "oneOf": [
            {
              "enum": [
                "unknown"
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
                "complete"
              ],
              "type": "string"
            }
          ]
        },
        "items": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.InventoryItem"
          },
          "maxItems": 128,
          "type": "array"
        }
      },
      "required": [
        "coverage",
        "items"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.InventoryItem": {
      "additionalProperties": false,
      "properties": {
        "equipmentId": {
          "maxLength": 80,
          "minLength": 1,
          "type": "string"
        },
        "quantity": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 128,
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
        "equipmentId",
        "quantity"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.ItemResult": {
      "additionalProperties": false,
      "properties": {
        "availableQuantity": {
          "anyOf": [
            {
              "format": "int32",
              "maximum": 128,
              "minimum": 0,
              "type": "integer"
            },
            {
              "type": "null"
            }
          ]
        },
        "equipmentId": {
          "maxLength": 80,
          "type": "string"
        },
        "reason": {
          "oneOf": [
            {
              "enum": [
                "exact_inventory_match"
              ],
              "type": "string"
            },
            {
              "enum": [
                "insufficient_quantity"
              ],
              "type": "string"
            },
            {
              "enum": [
                "inventory_incomplete"
              ],
              "type": "string"
            },
            {
              "enum": [
                "quantity_unknown"
              ],
              "type": "string"
            },
            {
              "enum": [
                "identity_unspecified"
              ],
              "type": "string"
            }
          ]
        },
        "requiredQuantity": {
          "format": "int32",
          "maximum": 16,
          "minimum": 1,
          "type": "integer"
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "availableQuantity",
        "equipmentId",
        "reason",
        "requiredQuantity",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.MuscleMatch": {
      "additionalProperties": false,
      "properties": {
        "matchedTargetId": {
          "anyOf": [
            {
              "maxLength": 80,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "points": {
          "format": "int32",
          "maximum": 100,
          "minimum": 0,
          "type": "integer"
        },
        "reason": {
          "oneOf": [
            {
              "enum": [
                "exact_target"
              ],
              "type": "string"
            },
            {
              "enum": [
                "documented_descendant"
              ],
              "type": "string"
            },
            {
              "enum": [
                "only_broader_attribution"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unreviewed_attribution"
              ],
              "type": "string"
            },
            {
              "enum": [
                "protocol_only"
              ],
              "type": "string"
            },
            {
              "enum": [
                "no_documented_match"
              ],
              "type": "string"
            },
            {
              "enum": [
                "attribution_unknown"
              ],
              "type": "string"
            },
            {
              "enum": [
                "role_unspecified"
              ],
              "type": "string"
            },
            {
              "enum": [
                "different_role"
              ],
              "type": "string"
            }
          ]
        },
        "requestedTargetId": {
          "maxLength": 80,
          "type": "string"
        },
        "role": {
          "anyOf": [
            {
              "oneOf": [
                {
                  "enum": [
                    "primary"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "secondary"
                  ],
                  "type": "string"
                },
                {
                  "enum": [
                    "unspecified"
                  ],
                  "type": "string"
                }
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "matchedTargetId",
        "points",
        "reason",
        "requestedTargetId",
        "role",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.MuscleResult": {
      "additionalProperties": false,
      "properties": {
        "declaredTargets": {
          "format": "int32",
          "maximum": 17,
          "minimum": 0,
          "type": "integer"
        },
        "evidenceStatus": {
          "oneOf": [
            {
              "enum": [
                "declared_reviewed"
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
                "unreviewed"
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
                "synthetic"
              ],
              "type": "string"
            }
          ]
        },
        "matches": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.MuscleMatch"
          },
          "maxItems": 8,
          "type": "array"
        },
        "qualifyingTargets": {
          "format": "int32",
          "maximum": 17,
          "minimum": 0,
          "type": "integer"
        },
        "softwareScore": {
          "format": "int32",
          "maximum": 800,
          "minimum": 0,
          "type": "integer"
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "declaredTargets",
        "evidenceStatus",
        "matches",
        "qualifyingTargets",
        "softwareScore",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.Page": {
      "additionalProperties": false,
      "properties": {
        "candidates": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Variant"
          },
          "maxItems": 48,
          "type": "array"
        },
        "contentVersion": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        },
        "equipment": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.EquipmentDefinition"
          },
          "maxItems": 256,
          "type": "array"
        },
        "families": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueFoundation.V1.Family"
          },
          "maxItems": 48,
          "type": "array"
        },
        "registryVersion": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        },
        "taxonomyVersion": {
          "maxLength": 80,
          "minLength": 1,
          "type": "string"
        }
      },
      "required": [
        "candidates",
        "contentVersion",
        "equipment",
        "families",
        "registryVersion",
        "taxonomyVersion"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.Query": {
      "additionalProperties": false,
      "properties": {
        "expandVariants": {
          "type": "boolean"
        },
        "inventory": {
          "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.Inventory"
        },
        "mode": {
          "oneOf": [
            {
              "enum": [
                "browse"
              ],
              "type": "string"
            },
            {
              "enum": [
                "search"
              ],
              "type": "string"
            }
          ]
        },
        "muscleMode": {
          "oneOf": [
            {
              "enum": [
                "any"
              ],
              "type": "string"
            },
            {
              "enum": [
                "all"
              ],
              "type": "string"
            }
          ]
        },
        "muscleRole": {
          "oneOf": [
            {
              "enum": [
                "any"
              ],
              "type": "string"
            },
            {
              "enum": [
                "primary"
              ],
              "type": "string"
            },
            {
              "enum": [
                "secondary"
              ],
              "type": "string"
            }
          ]
        },
        "muscleTargets": {
          "items": {
            "maxLength": 80,
            "minLength": 1,
            "type": "string"
          },
          "maxItems": 8,
          "type": "array",
          "uniqueItems": true
        }
      },
      "required": [
        "inventory",
        "muscleMode",
        "muscleTargets"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.Result": {
      "additionalProperties": false,
      "properties": {
        "basis": {
          "enum": [
            "structural_filter_relevance_not_physiology"
          ],
          "type": "string"
        },
        "contentVersion": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        },
        "effectiveTargets": {
          "items": {
            "maxLength": 80,
            "type": "string"
          },
          "maxItems": 8,
          "type": "array"
        },
        "evaluatedVariants": {
          "format": "int32",
          "maximum": 48,
          "minimum": 0,
          "type": "integer"
        },
        "expanded": {
          "type": "boolean"
        },
        "matchedVariants": {
          "format": "int32",
          "maximum": 48,
          "minimum": 0,
          "type": "integer"
        },
        "policyVersion": {
          "maxLength": 80,
          "type": "string"
        },
        "registryVersion": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        },
        "requestedRole": {
          "oneOf": [
            {
              "enum": [
                "any"
              ],
              "type": "string"
            },
            {
              "enum": [
                "primary"
              ],
              "type": "string"
            },
            {
              "enum": [
                "secondary"
              ],
              "type": "string"
            }
          ]
        },
        "requestedTargets": {
          "items": {
            "maxLength": 80,
            "type": "string"
          },
          "maxItems": 8,
          "type": "array"
        },
        "scope": {
          "enum": [
            "supplied_candidates_only"
          ],
          "type": "string"
        },
        "selections": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.Selection"
          },
          "maxItems": 48,
          "type": "array"
        },
        "taxonomyVersion": {
          "maxLength": 80,
          "type": "string"
        },
        "unknownVariants": {
          "format": "int32",
          "maximum": 48,
          "minimum": 0,
          "type": "integer"
        },
        "variants": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.VariantResult"
          },
          "maxItems": 48,
          "type": "array"
        }
      },
      "required": [
        "basis",
        "contentVersion",
        "effectiveTargets",
        "evaluatedVariants",
        "expanded",
        "matchedVariants",
        "policyVersion",
        "registryVersion",
        "requestedTargets",
        "scope",
        "selections",
        "taxonomyVersion",
        "unknownVariants",
        "variants"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.Selection": {
      "additionalProperties": false,
      "properties": {
        "familyId": {
          "anyOf": [
            {
              "maxLength": 100,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "matchedVariantKeys": {
          "items": {
            "maxLength": 100,
            "type": "string"
          },
          "maxItems": 48,
          "type": "array",
          "uniqueItems": true
        },
        "selectedCatalogueKey": {
          "maxLength": 100,
          "type": "string"
        },
        "softwareScore": {
          "format": "int32",
          "maximum": 800,
          "minimum": 0,
          "type": "integer"
        }
      },
      "required": [
        "familyId",
        "matchedVariantKeys",
        "selectedCatalogueKey",
        "softwareScore"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.SetupResult": {
      "additionalProperties": false,
      "properties": {
        "items": {
          "items": {
            "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.ItemResult"
          },
          "maxItems": 8,
          "type": "array"
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "items",
        "status"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueMatching.V1.VariantResult": {
      "additionalProperties": false,
      "properties": {
        "catalogueKey": {
          "maxLength": 100,
          "type": "string"
        },
        "equipment": {
          "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.EquipmentResult"
        },
        "familyId": {
          "anyOf": [
            {
              "maxLength": 100,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "muscles": {
          "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.MuscleResult"
        },
        "status": {
          "oneOf": [
            {
              "enum": [
                "matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "not_matched"
              ],
              "type": "string"
            },
            {
              "enum": [
                "unknown"
              ],
              "type": "string"
            }
          ]
        },
        "visibilityAllowed": {
          "type": "boolean"
        }
      },
      "required": [
        "catalogueKey",
        "equipment",
        "familyId",
        "muscles",
        "status",
        "visibilityAllowed"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueReviewedRead.V1.CatalogueReviewedReadPage": {
      "additionalProperties": false,
      "properties": {
        "catalogue": {
          "$ref": "#/$defs/GeniusFitness.CatalogueAdmission.V1.CatalogueReviewedSubsetPage"
        },
        "continuationUnit": {
          "oneOf": [
            {
              "enum": [
                "family_block"
              ],
              "type": "string"
            },
            {
              "enum": [
                "variant"
              ],
              "type": "string"
            }
          ]
        },
        "evaluatedUnits": {
          "format": "int32",
          "maximum": 48,
          "minimum": 0,
          "type": "integer"
        },
        "evaluatedVariants": {
          "format": "int32",
          "maximum": 48,
          "minimum": 0,
          "type": "integer"
        },
        "formatVersion": {
          "enum": [
            1
          ],
          "type": "integer"
        },
        "inventoryBasis": {
          "enum": [
            "caller_supplied_or_unknown"
          ],
          "type": "string"
        },
        "matching": {
          "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.Result"
        },
        "nextCursor": {
          "anyOf": [
            {
              "maxLength": 2048,
              "minLength": 1,
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "scope": {
          "enum": [
            "reviewed_subset_only"
          ],
          "type": "string"
        }
      },
      "required": [
        "catalogue",
        "continuationUnit",
        "evaluatedUnits",
        "evaluatedVariants",
        "formatVersion",
        "inventoryBasis",
        "matching",
        "nextCursor",
        "scope"
      ],
      "type": "object"
    },
    "GeniusFitness.CatalogueReviewedRead.V1.CatalogueReviewedReadQuery": {
      "additionalProperties": false,
      "properties": {
        "cursor": {
          "maxLength": 2048,
          "minLength": 1,
          "type": "string"
        },
        "filters": {
          "$ref": "#/$defs/GeniusFitness.CatalogueMatching.V1.Query"
        },
        "limit": {
          "format": "int32",
          "maximum": 48,
          "minimum": 1,
          "type": "integer"
        },
        "version": {
          "maxLength": 64,
          "pattern": "^[a-f0-9]{64}$",
          "type": "string"
        }
      },
      "type": "object"
    }
  }
};
