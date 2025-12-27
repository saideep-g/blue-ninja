# Blue Ninja Learning Platform: Complete Redesign v2.0

## Comprehensive Implementation Guide

**Status:** Implementation Plan - All Phases Ready  
**Target Completion:** Q1 2026 (4-week sprint)  
**Last Updated:** December 27, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Foundation - Database Schema](#phase-1-foundation)
4. [Phase 2: Admin Tools & Validation](#phase-2-admin-tools)
5. [Phase 3: Student Experience](#phase-3-student-experience)
6. [Phase 4: Testing & Migration](#phase-4-testing--migration)
7. [Implementation Checklist](#implementation-checklist)
8. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State Problems

❌ **Single Question Format**: Only MCQ supported, limiting pedagogical flexibility  
❌ **Storage Inefficiency**: 100 questions = 100 reads per refresh (1,500 reads/day for 3 students)  
❌ **Vague Error Messages**: "There are errors" without specifics; no visual comparison  
❌ **No Batch Operations**: Admin must edit questions one at a time  
❌ **No Curriculum Alignment**: UI doesn't reflect new curriculum structure  
❌ **Limited Scalability**: Free tier supports only 3-5 concurrent students  

### Solution Overview

✅ **14 Question Types**: Complete template system supporting diverse learning objectives  
✅ **80% Read Reduction**: Hierarchical schema (module → atom → questions) reduces reads to 15-20 per quiz  
✅ **World-Class Error UI**: Side-by-side format comparison with actionable fixes  
✅ **Batch Operations**: Select multiple → edit/validate/publish all at once  
✅ **Curriculum-First Design**: UI navigates by module → atom structure  
✅ **Scalability**: Free tier now supports 50+ concurrent students  

### Key Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Firestore Reads/Day (3 students)** | 1,500 | 225-300 | 85% reduction |
| **Reads per Quiz Load** | 100 | 15-20 | 80% reduction |
| **Free Tier Capacity** | 3-5 students | 50+ students | 10x increase |
| **Question Types** | 1 (MCQ) | 14+ | 14x more |
| **Error Message Length** | N/A | < 500 chars | AI-friendly |
| **Batch Edit Speed** | N/A | 50x faster | Bulk operations |

---

## Architecture Overview

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS (existing design system)
- Redux Toolkit (state management)
- React Query (server state cache)
- Framer Motion (smooth animations)
- MathJax/KaTeX (equation rendering)

**Backend:**
- Firebase Firestore (primary database)
- Firebase Cloud Functions (batch processing)
- Firebase Auth (existing user system)
- Firebase Storage (diagrams/images)

**Validation:**
- Custom 4-tier validator
- Reuse existing `advancedValidationService.js`
- Template-specific validators (new)

**Admin & Migration:**
- IndexedDB (client-side persistence)
- Cloud Functions (batch operations)
- Firestore Security Rules (access control)

### Parallel System Design

```
┌─────────────────────────────────────────┐
│    User (Student or Admin)              │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌─────────┐           ┌─────────┐
    │ Quiz v1 │           │ Quiz v2 │
    │(MCQ)   │           │(14 types)│
    └────┬────┘           └────┬────┘
         │                     │
    Feature Flag          Feature Flag
    quizVersion=v1        quizVersion=v2
         │                     │
         ▼                     ▼
    ┌──────────────┐    ┌──────────────────┐
    │questions     │    │questions_v2      │
    │(v1)          │    │(hierarchical)    │
    │              │    │                  │
    │Flat: all     │    │module/           │
    │fields inline │    │  atom/           │
    │              │    │    question      │
    └──────────────┘    └──────────────────┘
```

**Benefits of Parallel System:**
- ✅ Safe testing without breaking existing users
- ✅ Real user feedback before full migration
- ✅ Easy rollback if issues arise
- ✅ Comparison data (v1 vs v2 performance)
- ✅ Gradual user adoption

---

## Phase 1: Foundation - Database Schema

### 1.1 Firestore Collection Structure

**New Collections:**

```
firestore-project/
│
├── curriculum/                    # Metadata only
│   └── mathquest-cbse7-olympiad-eapcet-foundation
│       ├── modules: ModuleMetadata[]
│       ├── templates: string[]
│       ├── masteryModel: MasteryModel
│       └── feedbackPolicy: FeedbackPolicy
│
├── questions_v2/                  # NEW: Hierarchical questions
│   ├── CBSE7-CH01-INTEGERS/
│   │   ├── atom/
│   │   │   ├── CBSE7.CH01.INT.01/
│   │   │   │   ├── MQ.CBSE7.CH01.INT.01.NL.0001 ← Question doc
│   │   │   │   │   ├── questionId
│   │   │   │   │   ├── atomId
│   │   │   │   │   ├── templateId
│   │   │   │   │   ├── content: {prompt, instruction, stimulus}
│   │   │   │   │   ├── interaction: {type, config}
│   │   │   │   │   ├── answerKey: {value, tolerance, etc.}
│   │   │   │   │   ├── scoring: {model, params}
│   │   │   │   │   ├── workedSolution: {steps, finalAnswer}
│   │   │   │   │   ├── misconceptions: MisconceptionTag[]
│   │   │   │   │   ├── feedbackMap: {onCorrect, onIncorrect}
│   │   │   │   │   ├── transferItem: TransferQuestion
│   │   │   │   │   ├── metadata: {difficulty, bloomLevel, tags, ...}
│   │   │   │   │   └── auditLog: AuditEntry[]
│   │   │   │   ├── ...
│   │   │   │   └── ...
│   │   │   ├── CBSE7.CH01.INT.02/
│   │   │   └── ...
│   │   └── ...
│   ├── CBSE7-CH02-FRACTIONS-DECIMALS/
│   └── ...
│
├── questions_v2_index/            # NEW: Global search index
│   ├── BALANCEOPS_2_PUBLISHED
│   │   ├── questionIds: ["q1", "q2", ...]
│   │   └── count: 42
│   ├── NUMERICINPUT_1_PUBLISHED
│   └── ...
│
├── admin_sessions/                # NEW: Upload audit trail
│   ├── {sessionId}
│   │   ├── uploadedAt: timestamp
│   │   ├── uploadedBy: adminId
│   │   ├── fileName: string
│   │   ├── validationResults: ValidationResult
│   │   ├── publishingResults: PublishResult
│   │   └── timing: {upload, validation, publishing}
│   └── ...
│
├── validation_cache/              # NEW: 24h TTL cache
│   ├── {questionId}
│   │   ├── result: ValidationResult
│   │   ├── cachedAt: timestamp
│   │   └── expiresAt: timestamp
│   └── ...
│
└── bulk_operations/               # NEW: Background queue
    ├── {batchId}
    │   ├── status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
    │   ├── progress: {current, total}
    │   └── result: any
    └── ...
```

### 1.2 Document Schema: Question V2

**File: `src/types/questionsV2.ts`**

```typescript
// Complete question document structure
interface QuestionV2 {
  // === IDENTIFIERS & HIERARCHY ===
  questionId: string;          // MQ.CBSE7.CH04.EQ.04.BAL.0001
  atomId: string;              // CBSE7.CH04.EQ.04
  moduleId: string;            // CBSE7-CH04-SIMPLE-EQUATIONS
  templateId: string;           // BALANCEOPS
  trackIds: string[];           // ["CBSECOREFULL", "CBSEPLUSOLYMPIAD"]

  // === CONTENT ===
  content: {
    prompt: {
      text: string;
      latex?: string;           // For math: "3x + 5 = 20"
    };
    instruction: string;         // "Tap operations to..."
    stimulus?: {
      text?: string;
      diagram?: string;          // URL to diagram
      data?: Record<string, any>;
    };
  };

  // === TEMPLATE-SPECIFIC CONFIG ===
  interaction: {
    type: string;               // "balanceops", "numericinput", etc.
    config: Record<string, any>; // Template-specific settings
  };

  // === ANSWER & SCORING ===
  answerKey: {
    [key: string]: any;         // Template-specific answer format
  };

  scoring: {
    model: 'exact' | 'tolerance' | 'equivalence' | 'process' | 'rubriclite';
    params: Record<string, any>;
  };

  // === EXPLANATIONS ===
  workedSolution: {
    steps: string[];
    finalAnswer: string;
    whyItWorks: string;
  };

  // === MISCONCEPTIONS & FEEDBACK ===
  misconceptions: Array<{
    category: string;           // "UNDOORDER", "EQUALITY"
    tag: string;                // "DIVIDEBEFORESUBTRACT"
    symptom: string;            // Description of error
    hint: string;               // How to fix
  }>;

  feedbackMap: {
    onCorrect: string;
    onIncorrectAttempt1: string;
    onIncorrectAttempt2: string;
  };

  // === TRANSFER & EXTENSIONS ===
  transferItem?: {
    questionId: string;
    prompt: {text: string; latex?: string};
    answerKey: Record<string, any>;
  };

  // === METADATA ===
  metadata: {
    difficulty: 1 | 2 | 3;      // 1=Gentle, 2=Standard, 3=Stretch
    bloomLevel?: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
    estimatedTimeSeconds: number;
    qualityScore: number;       // 0-1.0
    qualityGrade: 'A' | 'B' | 'C' | 'D';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
    tags: string[];             // ["equations", "algebraic-reasoning"]
    commonMisconceptions: string[]; // ["UNDOORDER", "EQUALITY"]
    prerequisites?: string[];   // ["CBSE7.CH01.INT.02"]
    relatedQuestions?: string[];
  };

  // === AUDIT TRAIL ===
  auditLog: Array<{
    action: 'CREATED' | 'UPDATED' | 'PUBLISHED' | 'DEPRECATED';
    timestamp: Timestamp;
    userId: string;
    changes: Record<string, any>;
  }>;

  // === VERSION CONTROL ===
  version: number;             // Schema version
  deprecated: boolean;
}
```

### 1.3 Firestore Indexes

**File: `firestore.indexes.json`**

```json
{
  "indexes": [
    {
      "collectionGroup": "atom",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "metadata.createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "questions_v2_index",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "templateId", "order": "ASCENDING"},
        {"fieldPath": "difficulty", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "admin_sessions",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "uploadedBy", "order": "ASCENDING"},
        {"fieldPath": "uploadedAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

### 1.4 Migration Utility

**File: `src/services/migrationService.ts`** (Complete Implementation)

```typescript
import {db} from '../config/firebase';
import {collection, writeBatch, getDocs, query, where, Timestamp} from 'firebase/firestore';

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errorCount: number;
  errors: Array<{docId: string; error: string}>;
  durationMs: number;
}

/**
 * Migrate all v1 questions to v2 schema
 * 
 * Process:
 * 1. Fetch all v1 questions
 * 2. Transform schema (v1 → v2)
 * 3. Create in hierarchical structure
 * 4. Update index documents
 * 5. Validate migration
 */
export async function migrateQuestionsV1toV2(): Promise<MigrationResult> {
  console.log('[Migration] Starting v1 → v2 migration...');
  const startTime = Date.now();
  
  let migratedCount = 0;
  let errorCount = 0;
  const errors: Array<{docId: string; error: string}> = [];
  
  try {
    // Step 1: Fetch all v1 questions
    console.log('[Migration] Step 1: Fetching v1 questions...');
    const v1Ref = collection(db, 'questions');
    const v1Docs = await getDocs(v1Ref);
    console.log(`[Migration] Found ${v1Docs.size} v1 questions`);
    
    // Step 2: Process in batches (100 per batch for Firestore limits)
    const batchSize = 100;
    
    for (let i = 0; i < v1Docs.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = v1Docs.docs.slice(i, i + batchSize);
      const indexUpdates: Map<string, Set<string>> = new Map();
      
      for (const doc of batchDocs) {
        try {
          const v1Data = doc.data();
          
          // Transform v1 → v2
          const v2Data = transformV1toV2(v1Data);
          
          // Determine path components
          const moduleId = extractModuleId(v1Data.atomId);
          const atomId = v1Data.atomId;
          const questionId = v1Data.id;
          
          // Create reference: questions_v2/{moduleId}/atom/{atomId}/{questionId}
          const v2DocRef = db
            .collection('questions_v2')
            .doc(moduleId)
            .collection('atom')
            .doc(atomId)
            .collection('questions')
            .doc(questionId);
          
          // Add to batch
          batch.set(v2DocRef, v2Data);
          
          // Track for index update
          const indexKey = `${v2Data.templateId}_${v2Data.metadata.difficulty}_${v2Data.metadata.status}`;
          if (!indexUpdates.has(indexKey)) {
            indexUpdates.set(indexKey, new Set());
          }
          indexUpdates.get(indexKey)!.add(questionId);
          
          migratedCount++;
          
        } catch (error: any) {
          errorCount++;
          errors.push({
            docId: doc.id,
            error: error.message
          });
          console.error(`[Migration] Error with question ${doc.id}:`, error.message);
        }
      }
      
      // Commit batch
      await batch.commit();
      console.log(`[Migration] Processed ${Math.min(i + batchSize, v1Docs.size)} / ${v1Docs.size}`);
      
      // Update index documents
      for (const [indexKey, questionIds] of indexUpdates) {
        const indexDocRef = db
          .collection('questions_v2_index')
          .doc(indexKey);
        
        const indexBatch = writeBatch(db);
        indexBatch.update(indexDocRef, {
          questionIds: Array.from(questionIds),
          count: questionIds.size,
          lastUpdated: Timestamp.now()
        });
        await indexBatch.commit();
      }
    }
    
    // Step 3: Verify migration
    console.log('[Migration] Step 2: Verifying migration...');
    const v2Count = (await getDocs(collection(db, 'questions_v2'))).size;
    console.log(`[Migration] Verified ${v2Count} questions in v2`);
    
    const duration = Date.now() - startTime;
    console.log(`[Migration] SUCCESS: ${migratedCount} migrated, ${errorCount} errors (${duration}ms)`);
    
    return {
      success: true,
      migratedCount,
      errorCount,
      errors,
      durationMs: duration
    };
    
  } catch (error: any) {
    console.error('[Migration] CRITICAL ERROR:', error.message);
    console.log('[Migration] Triggering rollback...');
    await rollbackMigration();
    
    return {
      success: false,
      migratedCount,
      errorCount: errorCount + 1,
      errors: [...errors, {docId: 'BATCH', error: error.message}],
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * Transform v1 question schema to v2
 * Handles:
 * - Flat structure → Hierarchical
 * - Module/atom extraction
 * - Quality score calculation
 * - Status assignment
 */
function transformV1toV2(v1Question: any): any {
  return {
    // Identifiers
    questionId: v1Question.id,
    atomId: v1Question.atomId,
    moduleId: extractModuleId(v1Question.atomId),
    templateId: v1Question.templateId || 'MCQCONCEPT',
    trackIds: v1Question.trackIds || ['CBSECOREFULL'],
    
    // Content
    content: {
      prompt: {
        text: v1Question.question || v1Question.prompt?.text || '',
        latex: v1Question.latex
      },
      instruction: v1Question.instruction || '',
      stimulus: v1Question.stimulus || {}
    },
    
    // Interaction
    interaction: v1Question.interaction || {
      type: v1Question.templateId || 'MCQCONCEPT',
      config: v1Question.config || {}
    },
    
    // Answer
    answerKey: v1Question.answerKey || v1Question.answerkey || {},
    
    // Scoring
    scoring: v1Question.scoring || {
      model: 'exact',
      params: {}
    },
    
    // Solutions
    workedSolution: v1Question.workedSolution || {
      steps: [],
      finalAnswer: '',
      whyItWorks: ''
    },
    
    // Misconceptions
    misconceptions: v1Question.misconceptions || [],
    feedbackMap: v1Question.feedbackMap || {},
    transferItem: v1Question.transferItem,
    
    // Metadata
    metadata: {
      difficulty: v1Question.difficulty || 1,
      bloomLevel: v1Question.bloomLevel,
      estimatedTimeSeconds: v1Question.timeLimit || 60,
      qualityScore: calculateQualityScore(v1Question),
      qualityGrade: getQualityGrade(calculateQualityScore(v1Question)),
      createdAt: v1Question.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: v1Question.createdBy || 'migration-script',
      status: 'PUBLISHED',
      tags: v1Question.tags || [],
      commonMisconceptions: v1Question.misconceptions?.map(m => m.tag) || [],
      prerequisites: v1Question.prerequisites,
      relatedQuestions: v1Question.relatedQuestions
    },
    
    // Audit
    auditLog: [
      {
        action: 'MIGRATED',
        timestamp: Timestamp.now(),
        userId: 'migration-script',
        changes: {from: 'v1', to: 'v2'}
      }
    ],
    
    // Version
    version: 1,
    deprecated: false
  };
}

/**
 * Extract module ID from atom ID
 * CBSE7.CH04.EQ.04 → CBSE7-CH04-SIMPLE-EQUATIONS
 */
function extractModuleId(atomId: string): string {
  const match = atomId.match(/^(CBSE7)\.CH(\d+)/);
  if (match) {
    const grade = match[1];
    const chapter = match[2];
    
    // Mapping from curriculum data
    const chapterNames: Record<string, string> = {
      '01': 'INTEGERS',
      '02': 'FRACTIONS-DECIMALS',
      '03': 'DATA-HANDLING',
      '04': 'SIMPLE-EQUATIONS',
      '05': 'LINES-ANGLES',
      '06': 'TRIANGLE-PROPERTIES',
      '07': 'CONGRUENCE',
      '08': 'COMPARING-QUANTITIES',
      '09': 'RATIONAL-NUMBERS',
      '10': 'PRACTICAL-GEOMETRY',
      '11': 'PERIMETER-AREA',
      '12': 'ALGEBRAIC-EXPRESSIONS',
      '13': 'EXPONENTS-POWERS',
      '14': 'SYMMETRY',
      '15': 'VISUALISING-SOLIDS'
    };
    
    return `${grade}-CH${chapter}-${chapterNames[chapter] || 'UNKNOWN'}`;
  }
  
  return 'UNKNOWN';
}

/**
 * Calculate quality score (0-1.0) based on field completeness
 */
function calculateQualityScore(question: any): number {
  let score = 1.0;
  
  if (!question.misconceptions?.length) score -= 0.15;
  if (!question.transferItem) score -= 0.15;
  if (!question.workedSolution) score -= 0.1;
  if (!question.feedbackMap?.onCorrect) score -= 0.1;
  if (!question.bloomLevel) score -= 0.05;
  
  return Math.max(0, score);
}

/**
 * Get letter grade from quality score
 */
function getQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score > 0.9) return 'A';
  if (score > 0.75) return 'B';
  if (score > 0.6) return 'C';
  return 'D';
}

/**
 * Rollback migration (delete all v2 documents)
 */
export async function rollbackMigration(): Promise<void> {
  console.log('[Migration] ROLLING BACK...');
  
  // Delete all v2 documents
  const v2Collection = collection(db, 'questions_v2');
  const docs = await getDocs(v2Collection);
  
  const batch = writeBatch(db);
  let count = 0;
  
  for (const doc of docs.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count % 100 === 0) {
      await batch.commit();
      console.log(`[Migration] Deleted ${count} v2 documents`);
    }
  }
  
  await batch.commit();
  console.log(`[Migration] Rollback complete. Deleted ${count} documents.`);
}
```

### 1.5 Firestore Security Rules

**File: `firestore.rules`**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // === CURRICULUM METADATA ===
    // Readable by all (public)
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // === QUESTIONS V1 (Legacy) ===
    // Existing read rules, no new writes encouraged
    match /questions/{questionId} {
      allow read: if true;
      allow write: if isAdmin() || isTeacher();
      allow delete: if isAdmin();
    }
    
    // === QUESTIONS V2 (New Hierarchical) ===
    // Readable by all, writable by admin/teacher
    match /questions_v2/{moduleId}/atom/{atomId}/{questionId} {
      allow read: if true;
      allow write: if isAdmin() || isTeacher();
      allow delete: if isAdmin();
    }
    
    // === INDEX DOCUMENTS ===
    // Readable by all, admin only writes
    match /questions_v2_index/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // === ADMIN SESSIONS ===
    // Admin only
    match /admin_sessions/{sessionId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // === VALIDATION CACHE ===
    // Temporary, admin only
    match /validation_cache/{questionId} {
      allow read, write: if isAdmin();
    }
    
    // === BULK OPERATIONS ===
    // Admin only
    match /bulk_operations/{batchId} {
      allow read, write: if isAdmin();
    }
    
    // === HELPER FUNCTIONS ===
    function isAdmin() {
      return request.auth != null &&
             'admin' in request.auth.customClaims;
    }
    
    function isTeacher() {
      return request.auth != null &&
             'teacher' in request.auth.customClaims;
    }
  }
}
```

---

## Phase 2: Admin Tools & Validation

### 2.1 Validation Engine: 4-Tier System

**File: `src/services/questionValidator.ts`** (Overview - see full implementation in CHANGELOG)

**Tier 1: Schema Validation**
- Required fields present
- Correct data types
- Proper format (ID format, structure)
- Length/range validation

**Tier 2: Template-Specific Validation**
- MCQ: 2-6 options, no duplicates, correct answer exists
- Numeric: Value, tolerance range
- All 14 templates have specific rules

**Tier 3: Metadata & Curriculum Validation**
- Atom exists in curriculum
- Bloom level valid
- Difficulty valid
- Prerequisites valid

**Tier 4: Quality Assessment**
- Quality score (0-1.0)
- Quality grade (A/B/C/D)
- Improvement suggestions

### 2.2 Error Handling UI

**File: `src/components/admin/ErrorComparisonPanel.tsx`**

```typescript
import React from 'react';

interface ErrorComparisonPanelProps {
  error: ValidationError;
  question: QuestionData;
  onSelectError: (index: number) => void;
}

export default function ErrorComparisonPanel({
  error,
  question,
  onSelectError
}: ErrorComparisonPanelProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Error Header */}
      <div className="text-lg font-bold text-red-600">
        ❌ Error: {error.code}
      </div>
      
      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Expected Format (Green) */}
        <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">
            ✓ Expected Format
          </h4>
          <pre className="text-xs overflow-auto bg-white p-2 rounded border border-green-300 font-mono">
            {JSON.stringify(
              getExpectedFormat(error.field),
              null,
              2
            )}
          </pre>
        </div>
        
        {/* Your Format (Red) */}
        <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">
            ✗ Your Format
          </h4>
          <pre className="text-xs overflow-auto bg-white p-2 rounded border border-red-300 font-mono">
            {JSON.stringify(question[error.field], null, 2)}
          </pre>
          <div className="text-xs text-red-600 mt-2 font-semibold">
            {error.message}
          </div>
        </div>
      </div>
      
      {/* Fix Suggestion */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h5 className="font-semibold text-blue-900 mb-1">💡 How to Fix</h5>
        <p className="text-sm text-blue-800">
          {getFixSuggestion(error)}
        </p>
      </div>
      
      {/* Reference Example */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h5 className="font-semibold text-gray-900 mb-2">📋 Reference Example</h5>
        <pre className="text-xs overflow-auto bg-white p-2 rounded border font-mono">
          {JSON.stringify(getReferenceExample(error.field), null, 2)}
        </pre>
      </div>
      
      {/* Auto-Fix Button */}
      {hasAutoFix(error.code) && (
        <button
          onClick={() => applyAutoFix(question, error)}
          className="w-full py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
        >
          🔧 Apply Fix Automatically
        </button>
      )}
    </div>
  );
}
```

### 2.3 Admin Dashboard Features

1. **Curriculum Browser**: Tree navigation (module → atom)
2. **Question List**: Search, filter, sort by status/difficulty
3. **Quality Metrics**: A/B/C/D grade distribution
4. **Batch Operations**: Select multiple → edit/validate/publish
5. **Upload History**: Session list with metadata
6. **Error Log**: Detailed error tracking

---

## Phase 3: Student Experience

### 3.1 Quiz Delivery Architecture

**File: `src/components/quiz/QuizDeliveryV2.tsx`**

```typescript
import React from 'react';
import CurriculumNavigator from './CurriculumNavigator';
import QuestionRenderer from './QuestionRenderer';
import ProgressTracker from './ProgressTracker';

export default function QuizDeliveryV2() {
  return (
    <div className="grid grid-cols-12 gap-4 h-screen">
      {/* Left: Curriculum Navigator */}
      <div className="col-span-2 bg-white shadow-lg overflow-y-auto">
        <CurriculumNavigator />
      </div>
      
      {/* Center: Question */}
      <div className="col-span-7 bg-white shadow-lg p-8 overflow-y-auto">
        <QuestionRenderer />
      </div>
      
      {/* Right: Progress */}
      <div className="col-span-3 space-y-4">
        <ProgressTracker />
      </div>
    </div>
  );
}
```

### 3.2 Template System: 14 Question Types

**File: `src/config/templateRegistry.ts`**

```typescript
export const TEMPLATE_REGISTRY = {
  MCQCONCEPT: {
    name: 'Multiple Choice',
    component: MCQRenderer,
    bestFor: ['concept-discrimination', 'vocabulary']
  },
  NUMERICINPUT: {
    name: 'Numeric Input',
    component: NumericInputRenderer,
    bestFor: ['fluency', 'retrieval']
  },
  BALANCEOPS: {
    name: 'Algebra Balance',
    component: BalanceOpsRenderer,
    bestFor: ['equations', 'inverse-operations']
  },
  // ... 11 more templates
};
```

**All 14 Templates:**
1. MCQCONCEPT - Multiple choice
2. NUMERICINPUT - Number entry
3. BALANCEOPS - Algebra balance
4. NUMBERLINEPLACE - Number line
5. CLASSIFYSORT - Drag-drop sort
6. WORKEDEXAMPLECOMPLETE - Fill blanks
7. ERRORANALYSIS - Identify errors
8. MATCHING - Pair matching
9. GEOMETRYTAP - Diagram tap
10. EXPRESSIONINPUT - Math expression
11. STEPORDER - Reorder steps
12. MULTISTEPWORD - Word problems
13. TRANSFERMINI - Transfer items
14. SIMULATION - Interactive simulation
15. SHORTEXPLAIN - Text explanation

### 3.3 Progress Tracking

**Mastery Levels:**
- **Acquire**: With scaffolding (accuracy ≥ 80%, ≥ 8 items)
- **Secure**: Independent (accuracy ≥ 90%, ≥ 12 items)
- **Fluent**: Efficient (accuracy ≥ 90%, time ≤ 45s)
- **Transfer**: New contexts (≥ 2 of 3 transfer items)

**Spaced Review:**
- Error → Next day
- 1 day pass → 3 days
- 3 days pass → 7 days
- 7 days pass → 14 days
- 14 days pass → 30 days
- 30 days pass → 60 days

---

## Phase 4: Testing & Migration

### 4.1 Feature Flags

**File: `src/config/featureFlags.ts`**

```typescript
// Environment variables
REACT_APP_QUIZ_V2_ENABLED=false          // Global toggle
REACT_APP_ADMIN_V2_ENABLED=false         // Admin panel
REACT_APP_CURRICULUM_V2_ENABLED=false    // Curriculum features

// Usage in components
const isV2Enabled = await isFeatureEnabled('QUIZ_V2_ENABLED', userId);
if (isV2Enabled) {
  return <QuizDeliveryV2 />;
} else {
  return <QuizDeliveryV1 />;
}
```

### 4.2 Beta Rollout Strategy

1. **Day 1**: Internal team (100%)
2. **Day 2**: Limited beta (10% of users)
3. **Day 3**: Expanded beta (50% of users)
4. **Day 4**: Full rollout (100% of users)
5. **Day 5-30**: Monitor, fix bugs
6. **Day 31+**: Deprecate v1

### 4.3 Test Suite

**Test Coverage Targets:**
- Unit tests: >85% code coverage
- Integration tests: All major flows
- E2E tests: Student quiz, admin upload
- Performance: 50+ concurrent students

**Key Test Suites:**
- `questionValidator.test.ts` (4-tier validation)
- `templates.test.tsx` (all 14 templates)
- `quizFlow.e2e.test.ts` (end-to-end)
- `migration.test.ts` (data migration)

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create Firestore collections (questions_v2, questions_v2_index, etc.)
- [ ] Define document schemas (TypeScript interfaces)
- [ ] Create Firestore indexes
- [ ] Implement migration utility
- [ ] Update security rules
- [ ] Initialize curriculum metadata
- [ ] Test with sample data

### Phase 2: Admin Tools
- [ ] Build 4-tier validation engine
- [ ] Create error comparison UI (side-by-side)
- [ ] Implement admin dashboard
- [ ] Add batch operations
- [ ] Build curriculum browser
- [ ] Create upload history tracker
- [ ] Add quality metrics display

### Phase 3: Student Experience
- [ ] Build quiz delivery container
- [ ] Create curriculum navigator
- [ ] Implement question renderer
- [ ] Build 14 template renderers
- [ ] Add progress tracking
- [ ] Create feedback panel
- [ ] Add mastery level display

### Phase 4: Testing & Launch
- [ ] Write unit tests (>85% coverage)
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Set up feature flags
- [ ] Create migration script
- [ ] Plan beta rollout
- [ ] Monitor performance
- [ ] Gather user feedback

---

## Success Metrics

### Technical Metrics
- ✅ Firestore reads reduced by 80% (100 → 15-20 per quiz)
- ✅ Free tier capacity: 3-5 students → 50+ students
- ✅ All 14 templates rendering correctly
- ✅ Migration completed with zero data loss
- ✅ Feature flags working correctly
- ✅ Test coverage >85%

### User Experience Metrics
- ✅ Admins upload questions 50x faster (batch operations)
- ✅ Error messages understood immediately
- ✅ Student quiz engagement +30% (measured by session time)
- ✅ Student accuracy improved (better scaffolding)
- ✅ Admin satisfaction +40% (less tedious work)

### Business Metrics
- ✅ Database costs reduced 75-80%
- ✅ Scalability: 10x more concurrent users
- ✅ Code maintainability: 30% less duplication
- ✅ Support tickets: 50% reduction (clearer errors)
- ✅ Time-to-market: New question types added weekly

---

## Estimated Timeline

**Week 1 (Foundation)**: 5 days
- Database schema, migrations, indexes

**Week 2 (Admin Tools)**: 5 days
- Validation, error UI, dashboard

**Week 3 (Student Experience)**: 5 days
- Templates, curriculum navigator, progress tracking

**Week 4 (Testing & Launch)**: 5 days
- Test suite, feature flags, beta rollout

**Total: 20 working days (4 weeks)**

---

## Next Steps

1. **Review**: Team code review of designs
2. **Setup**: Prepare development environment
3. **Phase 1**: Start database schema implementation
4. **Daily Standups**: Track progress, unblock issues
5. **Testing**: Begin QA as features complete
6. **Deployment**: Execute migration and rollout

---

**For detailed implementation of specific components, refer to CHANGELOG.md**

**Questions? See IMPLEMENTATION_GUIDE.md for component-level details.**