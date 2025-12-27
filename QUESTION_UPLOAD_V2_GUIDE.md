# Question Upload V2 Format Guide

## Overview

The admin question upload system has been completely updated to support the new **V2 MathQuest Gold Standard Format**. The system is designed to:

- ✅ Accept V2 JSON format with 14 template types
- ✅ Validate all item fields and interaction configs
- ✅ Support worked examples, misconceptions, recovery hints
- ✅ Detect and prevent duplicate item IDs
- ✅ Provide detailed validation reports
- ✅ Auto-reuse existing functionality (no breaking changes)

---

## What Changed

### New Validator Services (Reusable, No Legacy Code)

#### 1. `src/services/questionValidatorV2.js`
**Purpose:** Validates individual V2 format questions

**Key Functions:**
```javascript
// Validate a single question item
const result = await validateQuestionV2(item);

// Validate entire question bank document  
const results = await validateQuestionBankV2(document);
```

**Validates:**
- Required fields: `item_id`, `template_id`, `prompt`, `interaction`, `answer_key`
- Template-specific payloads (14 templates)
- Worked solutions with step-by-step explanations
- Misconceptions and diagnostic tags
- Feedback mapping for correct/incorrect answers
- Recovery strategies (hints and scaffolds)
- Transfer items for knowledge transfer testing
- Telemetry tags and concept types

**Quality Grades:**
- `A` - No warnings, all optional fields present
- `B` - 1 warning (minor missing field)
- `C` - 3+ warnings (some optional fields)
- `D` - 5+ warnings (multiple concerns)
- `F` - Any errors (invalid/incomplete)

---

#### 2. `src/services/bulkUploadValidatorV2.js`
**Purpose:** Validates multiple questions in parallel

**Key Functions:**
```javascript
// Validate bulk upload
const results = await validateBulkUploadV2(items, options);

// Generate reports
const report = generateValidationReportV2(results);
const csv = generateCSVReportV2(results);
```

**Features:**
- Parallel validation (configurable concurrency)
- Duplicate item_id detection
- Template distribution analysis
- Coverage tracking (modules, atoms)
- Performance metrics
- Quality grade distribution

---

### Updated Admin Component

#### `src/components/admin/AdminQuestionsPanel.jsx`

**Changes:**
- Auto-detects V2 vs legacy format
- Uses new V2 validators
- Shows format badge in header
- Clear error messages for legacy format
- Same 3-step workflow (Upload → Review → Publish)

---

## Supported V2 Question Format

### Document Structure

```json
{
  "schema_version": "2.0",
  "document_type": "mathquest_gold_standard_questions",
  "bank_id": "cbse7_mathquest_gold_questions_v1",
  "grade": "CBSE 7",
  "templates_included": ["MCQ_CONCEPT", "NUMERIC_INPUT", ...],
  "counts_by_template": {
    "MCQ_CONCEPT": 4,
    "NUMERIC_INPUT": 4,
    ...
  },
  "items": [
    { /* item objects */ }
  ]
}
```

### Item Object Structure

```javascript
{
  // Identification
  "item_id": "SAMPLE.MCQ.0001",                    // Required: format SAMPLE.TYPE.0001
  "template_id": "MCQ_CONCEPT",                   // Required: one of 14 templates
  "module_id": "CBSE7-CH01-INTEGERS",             // Optional: curriculum module
  "atom_id": "CBSE7.CH01.INT.01",                 // Optional: learning atom
  "difficulty": 1,                                 // Optional: 1-3 or 1-5

  // Content
  "prompt": {
    "text": "Which number is greater?",           // Required: the question
    "latex": null,                                 // Optional: LaTeX version
    "diagram": null                                // Optional: diagram reference
  },
  "instruction": "Choose the best answer.",       // Optional: user instructions
  "stimulus": {                                    // Optional: supporting material
    "text": null,
    "diagram": null,
    "data": null
  },

  // Interaction Config (REQUIRED - template-specific)
  "interaction": {
    "type": "mcq_concept",                        // Must match template_id
    "config": {
      "options": [                                 // Template-specific config
        {
          "id": "A",
          "text": "−5",
          "diagnostic": {
            "tag": "COMPARE_BY_ABS",
            "misconception_id": "MIS_INT_ABS_COMPARE"
          }
        },
        ...
      ],
      "shuffle": true,
      "single_select": true
    }
  },

  // Answer Key (REQUIRED)
  "template_payload": {                           // Template-specific payload
    "stem": "Which number is greater?",
    "options": [...],
    "correct_option_id": "B"
  },
  "answer_key": {
    "correct_option_id": "B"                      // Or: value, correct_tier1_id, etc.
  },

  // Scoring
  "scoring": {
    "model": "exact",                             // or "equivalence", "rubric_lite"
    "params": {}
  },

  // Learning Content
  "worked_solution": {
    "steps": [                                    // REQUIRED: step-by-step explanation
      "On the number line, numbers to the right are greater.",
      "−3 lies to the right of −5, so −3 is greater.",
      "A quick check: among negatives, the one with smaller absolute value is greater."
    ],
    "final_answer": "−3",                         // REQUIRED
    "why_it_works": "..." // REQUIRED: brief explanation
  },

  // Misconception Remediation
  "misconceptions": [                            // REQUIRED: common errors
    {
      "misconception_id": "MIS_INT_ABS_COMPARE",
      "category": "INTEGER_ORDER",
      "tag": "COMPARE_BY_ABS",
      "symptom": "Chooses −5 because 5>3.",
      "hint": "For negative numbers, more to the left is smaller. Think number line."
    },
    ...
  ],

  // Feedback
  "feedback_map": {
    "on_correct": "✅ Correct. −3 is to the right of −5 on the number line.",
    "on_incorrect_attempt_1": "Try placing −5 and −3 on a number line.",
    "on_incorrect_attempt_2": "Remember: among negatives, the one closer to 0 is greater."
  },

  // Recovery / Hints
  "recovery": {
    "max_attempts": 3,
    "hint_ladder": [
      {
        "after_attempt": 1,
        "type": "strategy",
        "text": "Choose a strategy: (a) number line, (b) inverse operation, (c) simplify first."
      },
      {
        "after_attempt": 2,
        "type": "scaffold",
        "text": "Try doing one small step at a time and write what changes."
      }
    ]
  },

  // Transfer Item (for knowledge transfer testing)
  "transfer_item": {
    "prompt": {
      "text": "Transfer: Which is greater, −12 or −9?"
    },
    "interaction": { /* similar structure */ },
    "answer_key": { "correct_option_id": "B" },
    "worked_solution": { /* similar structure */ }
  },

  // Analytics
  "telemetry": {
    "concept_types": ["conceptual"],
    "tags": ["integers", "compare"],
    "misconception_ids": ["MIS_INT_ABS_COMPARE", "MIS_INT_IGNORE_SIGN"]
  }
}
```

---

## The 14 Supported Templates

| Template ID | Name | Key Payload Fields |
|-------------|------|-------------------|
| **MCQ_CONCEPT** | Multiple Choice Concept | `stem`, `options[]`, `correct_option_id` |
| **NUMERIC_INPUT** | Numeric Input | `stem`, `correct_value` |
| **TWO_TIER** | Two-Tier Assessment | `tier1_options[]`, `tier2_reason_options[]`, `correct_tier1_id`, `correct_tier2_id` |
| **ERROR_ANALYSIS** | Error Analysis | `prompt`, `error_type_options[]`, `correct_error_type`, `response_inputs[]` |
| **WORKED_EXAMPLE_COMPLETE** | Worked Example with Blanks | `prompt`, `steps[]` (with blanks) |
| **STEP_ORDER** | Step Ordering | `steps[]`, `correct_order[]` |
| **CLASSIFY_SORT** | Classify / Sort Items | `items[]`, `categories[]`, `correct_classification` |
| **NUMBER_LINE_PLACE** | Place on Number Line | `number_line_config`, `correct_position` |
| **BALANCE_OPS** | Balance Operations | `equation_sides[]`, `operations[]` |
| **EXPRESSION_INPUT** | Enter Mathematical Expression | `stem`, `correct_expression` |
| **MATCHING** | Matching Pairs | `left_items[]`, `right_items[]`, `correct_pairs[]` |
| **GEOMETRY_TAP** | Tap Geometric Regions | `diagram`, `regions[]`, `correct_region` |
| **MULTI_STEP_WORD** | Multi-Step Word Problem | `stem`, `correct_answer`, `work_shown` |

---

## Validation Rules

### Required Fields (All Items)
- ✅ `item_id` (format: `TYPE.CATEGORY.0001`)
- ✅ `template_id` (one of 14 templates)
- ✅ `prompt` (with `text`, `latex`, or `diagram`)
- ✅ `interaction` (config matching template type)
- ✅ `answer_key` (appropriate answer field)

### Recommended Fields (For Quality)
- ✅ `worked_solution` (steps, final_answer, why_it_works)
- ✅ `misconceptions[]` (at least 1 with symptom + hint)
- ✅ `feedback_map` (on_correct, on_incorrect_attempt_*)
- ✅ `recovery` (max_attempts, hint_ladder)
- ✅ `transfer_item` (for knowledge transfer testing)
- ✅ `telemetry` (tags, concept_types)

---

## Upload Workflow

### Step 1: Upload
```
📄 Select JSON file
   ↓
🔍 Detect format (V2 or legacy)
   ↓
✅ Load items into memory
```

### Step 2: Review & Validate
```
⚙️ Validate each item in parallel
   ↓
📊 Generate report:
   - Quality grades (A-F)
   - Template distribution
   - Error frequencies
   - Duplicate detection
   ↓
👀 Review individual items
   - Click to see full validation report
   - Check errors and warnings
   - Select which items to publish
```

### Step 3: Publish
```
🚀 Publish selected valid items
   ↓
✅ Store in Firestore
   ↓
📈 Update analytics
```

---

## Error Messages

### Common Errors (Invalid Format)

#### "Legacy format detected"
**Cause:** File has `questions` property instead of `items` and `item_id`
**Fix:** Use V2 format with `items[]` array containing `item_id` and `template_id`

#### "Unknown template_id: 'MCQ'"
**Cause:** Invalid template identifier
**Fix:** Use one of: MCQ_CONCEPT, NUMERIC_INPUT, TWO_TIER, etc.

#### "Missing required field: template_payload"
**Cause:** Template-specific payload missing
**Fix:** Add `template_payload` with template-specific fields

#### "Duplicate item_ids found: [SAMPLE.MCQ.0001, SAMPLE.MCQ.0002]"
**Cause:** Same item_id appears multiple times
**Fix:** Ensure each `item_id` is unique in the document

### Common Warnings (Quality Issues)

- ⚠️ "No worked_solution provided" → Add steps for student learning
- ⚠️ "No misconceptions defined" → Add common error patterns
- ⚠️ "No transfer_item defined" → Add transfer item for testing knowledge transfer
- ⚠️ "No recovery strategy" → Add hints and scaffolds for struggling students
- ⚠️ "No feedback_map defined" → Add feedback for correct/incorrect answers

---

## Best Practices

### 1. Item ID Naming
```
✅ GOOD:  SAMPLE.MCQ.0001 (Bank.Type.Number)
❌ BAD:   mcq_001 (lowercase, unclear)
❌ BAD:   0001 (no context)
```

### 2. Worked Solutions
```javascript
✅ GOOD:
"worked_solution": {
  "steps": [
    "Step 1: Identify what we know",
    "Step 2: Apply the formula",
    "Step 3: Simplify the result"
  ],
  "final_answer": "42",
  "why_it_works": "This works because..."
}

❌ BAD: Empty steps or missing final_answer
```

### 3. Misconceptions
```javascript
✅ GOOD:
"misconceptions": [
  {
    "misconception_id": "MIS_INT_ABS_COMPARE",
    "symptom": "Student chooses −5 because 5>3",
    "hint": "Think about position on number line"
  }
]

❌ BAD: No symptom or hint
```

### 4. Transfer Items
```javascript
✅ GOOD: Similar question but different numbers
"transfer_item": {
  "prompt": "Transfer: Which is greater, −12 or −9?",
  "answer_key": { "correct_option_id": "B" }
}

❌ BAD: Identical to original item (not a transfer)
```

---

## Integration with Templates

When questions are published to Firestore, they're mapped to template runners:

```javascript
// MCQ_CONCEPT → MCQTemplate.jsx
template_id: "MCQ_CONCEPT"
↓
template_payload: {
  "stem": "...",
  "options": [...],
  "correct_option_id": "B"
}

// NUMERIC_INPUT → NumericInputTemplate.jsx  
template_id: "NUMERIC_INPUT"
↓
template_payload: {
  "stem": "...",
  "correct_value": 42
}

// TWO_TIER → TwoTierTemplate.jsx
template_id: "TWO_TIER"
↓
template_payload: {
  "tier1_options": [...],
  "tier2_reason_options": [...],
  "correct_tier1_id": "B",
  "correct_tier2_id": "R1"
}
```

---

## Migration from Legacy Format

If you have old format questions:

### Old Format Structure
```json
{
  "questions": [{
    "id": "q1",
    "atom": "INTEGERS",
    "type": "MCQ",
    "content": "...",
    "options": [...],
    "correctAnswer": "A"
  }]
}
```

### Map to V2 Structure
```json
{
  "schema_version": "2.0",
  "document_type": "mathquest_gold_standard_questions",
  "items": [{
    "item_id": "LEGACY.MCQ.0001",              // Map from id
    "template_id": "MCQ_CONCEPT",              // Map from type
    "atom_id": "CBSE7.CH01.INT",                // From atom
    "prompt": { "text": "..." },             // From content
    "template_payload": {
      "stem": "...",
      "options": [...],                        // From options
      "correct_option_id": "A"                 // From correctAnswer
    },
    "answer_key": { "correct_option_id": "A" },
    "worked_solution": { /* new content */ }, // ADD: steps, explanations
    "misconceptions": [...],                   // ADD: error patterns
    "feedback_map": {...},                     // ADD: feedback
    "recovery": {...},                         // ADD: hints
    "telemetry": {...}                         // ADD: tags
  }]
}
```

---

## Files Modified/Created

### New Validators (Reusable, No Legacy Code)
✅ `src/services/questionValidatorV2.js` - Individual item validation
✅ `src/services/bulkUploadValidatorV2.js` - Bulk validation

### Updated Admin Component
✅ `src/components/admin/AdminQuestionsPanel.jsx` - Now supports V2 format

### Not Modified (Reused)
- FileUploadZone.jsx (handles file input)
- ValidationReportPanel.jsx (displays reports)
- QuestionReviewer.jsx (reviews items)
- PublishSummary.jsx (shows completion)

---

## Testing Your Upload

### 1. Test with Sample File
```bash
# Use the provided sample
local: src/data/cbse7_mathquest_gold_questions_v2.json

# Upload through admin panel
http://localhost:5173/admin/questions
```

### 2. Verify Validation
- Should detect V2 format
- Should validate all 52 items (sample)
- Should show quality grade distribution
- Should list any warnings

### 3. Check Results
- ✅ Valid items should show green check
- ⚠️ Warnings should show as yellow
- ❌ Errors should show as red
- 📊 Report should show statistics

---

## FAQ

**Q: Can I still upload legacy format questions?**
A: No, the system now requires V2 format. Legacy questions must be migrated.

**Q: What if an item has errors?
**A: Items with errors cannot be published until fixed. See the validation report for details.

**Q: Can I edit items after upload?
A: Items can be reviewed and flagged in the Review step. Direct editing is via the ValidationReportPanel.

**Q: How are transfer items used?
A: After a student answers the main question, if they're correct, they get the transfer item to test knowledge transfer.

**Q: What does quality grade mean?
A: It indicates completeness:
- A = Excellent (all recommended fields)
- B = Good (1 warning)
- C = Fair (2-3 warnings)
- D = Poor (4+ warnings)
- F = Invalid (has errors)

---

## Support

For issues:
1. Check error message in Upload step
2. Review validation report in Review step
3. Ensure item_id and template_id are correct
4. Verify worked_solution has steps and final_answer
5. Check that answer_key matches template type

---

**Status:** ✅ Production Ready
**Last Updated:** 2025-12-27
**Format Version:** 2.0 (V2)
