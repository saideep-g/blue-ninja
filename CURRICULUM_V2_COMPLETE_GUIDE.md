# Blue Ninja Curriculum v2 - Complete Integration Guide

## Overview

The curriculum v2 system uses **4 coordinated JSON files** that work together as a single, unified system. No overlaps, clear responsibilities:

```
┌─────────────────────────────────────────────────────────────────┐
│ CURRICULUM V2 SYSTEM (4 Files Working Together)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Doc0: Manifest (Index & Version Lock)                          │
│  File: cbse7_mathquest_manifest_v2.json                         │
│  └─ Version lock, bundle ID, supported grades/syllabi           │
│                                                                  │
│  Doc1: Core Curriculum (Learning Map)                           │
│  File: cbse7_mathquest_core_curriculum_v2.json                  │
│  └─ Modules → Atoms (skills) with prerequisites, outcomes       │
│                                                                  │
│  Doc2: Template Library (UI Contracts)                          │
│  File: mathquest_template_library_v2.json                       │
│  └─ Question template definitions, grading, telemetry           │
│                                                                  │
│  Doc3: Assessment Guide (Engine Room)                           │
│  File: cbse7_mathquest_assessment_guide_v2.json                 │
│  └─ Mastery profiles, sequencing, spaced review, analytics      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Document Roles & Responsibilities

### **Doc0: Manifest** (cbse7_mathquest_manifest_v2.json)

**Purpose**: Index file + version lock for the entire bundle

**What it contains**:
- `curriculum_bundle_id`: Unique ID for this curriculum set
- `schema_version`: "2.0" (indicates all docs are v2.0)
- `version_lock`: Maps Doc1/Doc2/Doc3 versions together
- `supported_grades`: [7, 8, 9] (scope)
- `supported_syllabi`: ["CBSE", "ICSE", ...]
- `metadata`: Creation date, author, description

**When to use it**:
- ✅ First file to load (validates bundle integrity)
- ✅ Version consistency checks
- ✅ Supported grade/syllabus scope

**When NOT to use it**:
- ❌ For curriculum navigation (use Doc1)
- ❌ For template definitions (use Doc2)
- ❌ For mastery rules (use Doc3)

**Example structure**:
```json
{
  "curriculum_bundle_id": "cbse7_mathquest_v2_202401",
  "schema_version": "2.0",
  "version_lock": {
    "doc1_version": "2.0",
    "doc2_version": "2.0",
    "doc3_version": "2.0"
  },
  "supported_grades": [7, 8, 9],
  "supported_syllabi": ["CBSE"],
  "metadata": {
    "created_at": "2024-01-15",
    "description": "Full CBSE Grade 7 Mathematics Curriculum"
  }
}
```

---

### **Doc1: Core Curriculum** (cbse7_mathquest_core_curriculum_v2.json)

**Purpose**: Learning map - shows hierarchy and structure

**What it contains**:
- **Modules**: Big topics (Chapter 1: Integers, Chapter 2: Fractions)
- **Atoms**: Smallest teachable skills within each module
  - `atom_id`: Unique ID (CBSE7.CH01.INT.01)
  - `title`: "Adding Integers"
  - `description`: Short explanation
  - `outcomes`: Learning objectives (CONCEPTUAL, PROCEDURAL, LOGICAL, TRANSFER)
  - `template_ids`: ["MCQ_CONCEPT", "NUMERIC_INPUT"] (references to Doc2)
  - `prerequisite_atom_ids`: ["CBSE7.CH01.INT.01"] (dependencies)
  - `misconception_ids`: ["INT.MISC.001"] (references to Doc3)
  - `mastery_profile_id`: "MP_CORE_FLUENCY" (reference to Doc3)

**When to use it**:
- ✅ Curriculum browser navigation
- ✅ Building skill trees
- ✅ Displaying atom metadata
- ✅ Finding prerequisites

**When NOT to use it**:
- ❌ For template rendering (use Doc2)
- ❌ For grading (use Doc2)
- ❌ For mastery rules (use Doc3)

**Example structure**:
```json
{
  "curriculum_id": "cbse7_mathquest_v2_202401",
  "schema_version": "2.0",
  "modules": [
    {
      "module_id": "CBSE7.CH01",
      "title": "Integers",
      "atoms": [
        {
          "atom_id": "CBSE7.CH01.INT.01",
          "title": "Understanding Integers",
          "description": "Positive and negative whole numbers",
          "outcomes": [
            {
              "type": "CONCEPTUAL",
              "description": "Understand positive/negative integers"
            }
          ],
          "template_ids": ["MCQ_CONCEPT", "NUMBER_LINE_PLACE"],
          "misconception_ids": ["INT.MISC.001"],
          "mastery_profile_id": "MP_CORE_FLUENCY",
          "prerequisites": ["CBSE6.CH01.WN.01"]
        }
      ]
    }
  ]
}
```

---

### **Doc2: Template Library** (mathquest_template_library_v2.json)

**Purpose**: UI + grading contracts for question types

**What it contains**:
- For each template ID (MCQ_CONCEPT, NUMERIC_INPUT, etc.):
  - `display_name`: Human-readable name
  - `description`: What this template is for
  - `payload_contract`: What fields the question JSON must have
  - `scoring_model`: How to grade answers
    - `type`: "EXACT_MATCH", "NUMERIC_TOLERANCE", etc.
    - `correct_answer_path`: Where the correct answer is in JSON
    - `tolerance`: For numeric answers
  - `telemetry_events`: What events to emit for analytics
    - Event names, what data to capture

**When to use it**:
- ✅ Rendering question UI (knows what fields to expect)
- ✅ Grading answers (knows scoring rules)
- ✅ Analytics/telemetry (knows what to track)
- ✅ Validating question JSON

**When NOT to use it**:
- ❌ For curriculum hierarchy (use Doc1)
- ❌ For adaptive sequencing (use Doc3)
- ❌ For mastery rules (use Doc3)

**Example structure**:
```json
{
  "schema_version": "2.0",
  "templates": {
    "MCQ_CONCEPT": {
      "display_name": "Multiple Choice - Conceptual",
      "description": "Check conceptual understanding",
      "payload_contract": {
        "required_fields": ["prompt", "options", "correct_option_index"]
      },
      "scoring_model": {
        "type": "EXACT_MATCH",
        "correct_answer_path": "correct_option_index"
      },
      "telemetry_events": [
        {
          "event_name": "question_submitted",
          "required_data": ["answer_index", "time_spent"]
        }
      ]
    },
    "NUMERIC_INPUT": {
      "display_name": "Numeric Input",
      "description": "Enter numeric answer with tolerance",
      "payload_contract": {
        "required_fields": ["prompt", "correct_value", "tolerance"]
      },
      "scoring_model": {
        "type": "NUMERIC_TOLERANCE",
        "correct_answer_path": "correct_value",
        "tolerance": "{{tolerance}}"
      }
    }
  }
}
```

---

### **Doc3: Assessment Guide** (cbse7_mathquest_assessment_guide_v2.json)

**Purpose**: Engine room - mastery, sequencing, spaced review, analytics

**What it contains**:

**1. Mastery Profiles** - Define what "mastery" means
```json
{
  "mastery_profiles": {
    "MP_CORE_FLUENCY": {
      "name": "Core Fluency",
      "thresholds": {
        "emerging": 0.40,
        "developing": 0.70,
        "proficient": 0.85,
        "mastery": 0.95
      }
    }
  }
}
```

**2. Sequencing Rules** - How to order atoms
```json
{
  "sequencing_rules": {
    "default_order": "prerequisite_first",
    "difficulty_progression": [1, 1, 2, 2, 3]
  }
}
```

**3. Spaced Review Rules** - When to revisit
```json
{
  "spaced_review_rules": {
    "review_after_days": [1, 3, 7, 14, 30],
    "boost_on_struggle": true
  }
}
```

**4. Analytics Event Specs** - What telemetry to capture
```json
{
  "analytics_event_specs": {
    "question_submitted": {
      "required_fields": ["atom_id", "template_id", "is_correct"],
      "optional_fields": ["time_spent", "strategy"]
    }
  }
}
```

**5. Prompt Recipes** - For AI question generation
```json
{
  "prompt_recipes": {
    "CBSE7.CH01.INT.01": {
      "template_id": "MCQ_CONCEPT",
      "cognitive_level": "RECALL",
      "example_prompt": "Which of these is an integer?"
    }
  }
}
```

**When to use it**:
- ✅ Determining mastery thresholds
- ✅ Adaptive sequencing (what question next)
- ✅ Spaced review scheduling
- ✅ Analytics event configuration
- ✅ AI prompt generation

**When NOT to use it**:
- ❌ For curriculum hierarchy (use Doc1)
- ❌ For template rendering (use Doc2)
- ❌ For simple atom metadata (use Doc1)

---

## How the 4 Files Work Together

### **Example: Student Takes a Daily Mission**

```
Step 1: Load Manifest
├─ Validates bundle ID: cbse7_mathquest_v2_202401
├─ Checks all Doc1/Doc2/Doc3 versions match (2.0)
└─ Confirms supported grades include student's grade

Step 2: Load & Index Core Curriculum (Doc1)
├─ Load modules and atoms
├─ Index atoms for O(1) lookup by ID
├─ Note template references (Doc2 IDs)
├─ Note misconception references (Doc3 IDs)
└─ Note mastery profile references (Doc3)

Step 3: Load Template Library (Doc2)
├─ For each template ID from Doc1 atoms
├─ Know how to render that question type
├─ Know how to grade the answer
├─ Know what events to emit
└─ Use template payload contract to validate questions

Step 4: Load Assessment Guide (Doc3)
├─ Get mastery thresholds for student's profile
├─ Get sequencing rules (what order to ask)
├─ Get spaced review intervals (when to repeat)
├─ Know analytics event schema
└─ Get prompt recipes for AI generation

Step 5: Generate 14-Slot Daily Mission
├─ Use Doc3 sequencing rules
├─ Select atoms from Doc1
├─ Get recommended templates from Doc1
├─ Use Doc3 mastery profile thresholds
├─ Apply spaced review rules from Doc3
└─ Return question list with template IDs

Step 6: Render Questions
├─ For each question
├─ Look up template in Doc2
├─ Use Doc2 payload contract to validate JSON
├─ Use Doc2 scoring model for grading
├─ Use Doc2 telemetry_events to track interactions
└─ Emit analytics events with Doc3 schema

Step 7: Record Analytics
├─ Event includes Doc1 atom metadata
├─ Event includes Doc2 template info
├─ Event includes Doc3 mastery profile
├─ Event includes learning outcomes
├─ Event includes misconception tracking
└─ All saved to Firestore enriched
```

---

## Integration in Code

### **Service Layer: curriculumV2Service.js**

This service orchestrates all 4 files:

```javascript
// Load all 4 files at startup
await curriculumV2Service.loadCurriculumV2();
// Returns unified curriculum object with:
// - .modules (from Doc1)
// - .atoms (from Doc1, indexed)
// - .templates (from Doc2)
// - .masteryProfiles (from Doc3)
// - .sequencingRules (from Doc3)
// - .spacedReviewRules (from Doc3)
// - .analyticsSchema (from Doc3)

// Lookup specific data
const atom = await curriculumV2Service.getAtomById("CBSE7.CH01.INT.01");
const template = await curriculumV2Service.getTemplateDefinition("MCQ_CONCEPT");
const mastery = await curriculumV2Service.getMasteryProfile("MP_CORE_FLUENCY");
```

### **Component: CurriculumBrowser.jsx**

Updated to use all 4 files:

```javascript
// Load curriculum (all 4 files)
const curriculum = await curriculumV2Service.loadCurriculumV2();

// Display hierarchy from Doc1
{curriculum.modules.map(module => (
  <Module>
    {module.atoms.map(atom => (
      // Show template references from Doc1
      // Show template details from Doc2
      // Show mastery profile from Doc3
    ))}
  </Module>
))}
```

### **Rendering Questions**

```javascript
// Get question from API
const question = fetchQuestionFromFirebase();

// Look up template contract from Doc2
const template = await curriculumV2Service.getTemplateDefinition(
  question.template_id
);

// Validate question JSON against contract
validate(question, template.payload_contract);

// Render using template UI
renderTemplate(question, template);

// Grade using template's scoring model
const isCorrect = grade(answer, question, template.scoring_model);

// Emit events using template's telemetry_events
emitEvents({
  ...template.telemetry_events,
  atom_id: question.atom_id,
  mastery_profile: atom.mastery_profile_id
});
```

---

## File Dependencies

```
Manifest (Doc0)
├─ Version lock → ensures Doc1/Doc2/Doc3 match
└─ Supports scope → grade/syllabus constraints

Core Curriculum (Doc1)
├─ template_ids → references to Doc2
├─ misconception_ids → references to Doc3
├─ mastery_profile_id → references to Doc3
└─ prerequisite_atom_ids → self-references

Template Library (Doc2)
└─ Standalone (no external references)
    (Doc1 atoms reference templates by ID)

Assessment Guide (Doc3)
└─ Standalone (no external references)
    (Doc1 atoms reference mastery profiles/misconceptions by ID)
```

---

## Best Practices

### **✅ DO**
- Load Manifest first (validates bundle)
- Use curriculumV2Service for all access (ensures consistency)
- Reference atoms by ID (from Doc1)
- Reference templates by ID (from Doc1)
- Reference mastery profiles by ID (from Doc1)
- Look up full definitions only when needed

### **❌ DON'T**
- Mix v1 and v2 curriculum files
- Reference across documents by full data (use IDs)
- Load Doc2/Doc3 before Doc0/Doc1
- Hardcode template or mastery IDs (use service)
- Modify any file directly (use versioning)

---

## Migration Path

### **From v1 to v2**

1. **Update CurriculumBrowser** (✅ DONE)
   - Uses curriculumV2Service
   - Displays all 4 files

2. **Update Daily Mission Generator** (In progress)
   - Uses Doc3 sequencing rules
   - Uses Doc3 spaced review rules

3. **Update Question Renderer** (In progress)
   - Uses Doc2 payload contracts
   - Uses Doc2 scoring models

4. **Update Analytics** (In progress)
   - Uses Doc2 telemetry_events
   - Uses Doc3 analytics_schema

---

## File Locations

```
src/
├── data/
│   ├── cbse7_mathquest_manifest_v2.json          (Doc0)
│   ├── cbse7_mathquest_core_curriculum_v2.json   (Doc1)
│   ├── mathquest_template_library_v2.json        (Doc2)
│   ├── cbse7_mathquest_assessment_guide_v2.json  (Doc3)
│   └── curriculumLoader.js
│
├── services/
│   └── curriculumV2Service.js                    (Orchestration)
│
└── components/
    ├── curriculum/
    │   └── CurriculumBrowser.jsx                 (Updated ✅)
    └── daily-mission/
        └── DailyMissionGenerator.jsx             (To update)
```

---

## Troubleshooting

### **Error: "File not found"**
→ Check file paths in src/data/

### **Error: "Version mismatch"**
→ Manifest.version_lock should match all files' schema_version

### **Error: "Template ID not found"**
→ Check that Doc1 references existing Doc2 template

### **Error: "Mastery profile not found"**
→ Check that Doc1 references existing Doc3 mastery profile

### **Questions not showing correct details**
→ Ensure all 4 files are loaded via curriculumV2Service

---

## Summary

| File | Role | Key Content |
|------|------|─────────────|
| **Doc0** Manifest | Version lock & index | Bundle ID, version check, scope |
| **Doc1** Core Curriculum | Learning map | Modules, atoms, prerequisites, outcomes |
| **Doc2** Template Library | UI & grading contracts | Template definitions, scoring models, telemetry |
| **Doc3** Assessment Guide | Engine room | Mastery profiles, sequencing, spaced review, analytics |

**Remember**: All 4 files work together as one system. No overlaps, clear responsibilities. Always use `curriculumV2Service` for access!
