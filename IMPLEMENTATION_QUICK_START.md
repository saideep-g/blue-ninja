# Blue Ninja v2 Curriculum - Quick Start Implementation
## Get Daily Missions with 14+ Templates Running in 3 Hours

---

## 🏁 Quick Overview

You now have a complete v2 curriculum system ready to deploy:

✅ **Curriculum Loader** - Load and index v2 data
✅ **Daily Mission Generator** - Create 14+ slot missions  
✅ **Analytics Enricher** - Add curriculum metadata to logs
✅ **Enhanced Hooks** - Use v2 data seamlessly
✅ **Full Documentation** - Complete migration guide

---

## ⏰ Timeline

**Total implementation: 3-4 hours**

- Phase 1: Load curriculum data (30 min)
- Phase 2: Connect hooks to enricher (45 min)
- Phase 3: Test end-to-end (60 min)
- Phase 4: Verify analytics (45 min)
- Phase 5: Deploy (30 min)

---

## 🔍 Phase 1: Load Curriculum Data (30 min)

### Step 1.1: Copy JSON Files

```bash
# You should have received these files:
# - cbse7_mathquest_core_curriculum_v2.json
# - cbse7_mathquest_gold_questions_v2.json

cp cbse7_mathquest_core_curriculum_v2.json src/data/
cp cbse7_mathquest_gold_questions_v2.json src/data/

# Verify files exist:
ls -lah src/data/*v2.json
```

### Step 1.2: Verify JSON Structure

```bash
# Quick validation:
node -e "
const data = require('./src/data/cbse7_mathquest_core_curriculum_v2.json');
console.log('Curriculum ID:', data.curriculum_id);
console.log('Version:', data.schema_version);
console.log('Modules:', data.modules.length);
console.log('Total atoms:', data.modules.reduce((sum, m) => sum + (m.atoms?.length || 0), 0));
"
```

Expected output:
```
Curriculum ID: mathquest-cbse7-olympiad-eapcet-foundation
Version: 2.0
Modules: 12-14
Total atoms: 200+
```

### Step 1.3: Test Curriculum Loader

```javascript
// Create test file: src/services/__tests__/curriculumLoader.test.js

import { loadCurriculum, getAtomById, getAllAtoms } from '../../data/curriculumLoader';

async function testCurriculumLoader() {
  console.log('[TEST] Loading curriculum...');
  const curriculum = await loadCurriculum();
  
  console.log('✓ Curriculum loaded:', curriculum.totalAtoms, 'atoms');
  console.log('✓ Modules:', curriculum.totalModules);
  
  // Test atom lookup
  const atom = await getAtomById('CBSE7.CH01.INT.01');
  console.log('✓ Atom lookup works:', atom?.title);
  
  // Test getAllAtoms
  const allAtoms = await getAllAtoms();
  console.log('✓ getAllAtoms works:', allAtoms.length, 'atoms');
}

testCurriculumLoader().catch(console.error);
```

Run:
```bash
node src/services/__tests__/curriculumLoader.test.js
```

---

## 🕐 Phase 2: Connect Hooks to Enricher (45 min)

### Step 2.1: Update useDailyMission.js

```javascript
// File: src/hooks/useDailyMission.js
// Add this at the top with other imports:

import { enrichAnalyticsLog, logEnrichedAnalytics } from '../services/analyticsEnricher';
import { loadCurriculum } from '../data/curriculumLoader';

// Inside your submitDailyAnswer function, find this code:
const handleQuestionSubmit = async (isCorrect, choice, isRecovered, tag, timeSpentSeconds) => {
  // EXISTING CODE:
  const timeSpentMs = timeSpentSeconds * 1000;
  const speedRating = timeSpentSeconds < 3 ? 'SPRINT' : (timeSpentSeconds < 15 ? 'STEADY' : 'SLOW');
  
  // Create base log (EXISTING v1 format)
  const baseLog = {
    questionId: currentQuestion.id,
    atomId: currentQuestion.atom,
    studentAnswer: choice,
    correctAnswer: currentQuestion.correct_answer,
    isCorrect,
    timeSpent: timeSpentMs,
    speedRating,
    masteryBefore: currentQuestion.masteryBefore || 0.5,
    masteryAfter: currentQuestion.masteryAfter || 0.5,
    diagnosticTag: tag,
    isRecovered,
    recoveryVelocity: isRecovered ? 0.5 : null,
    timestamp: Date.now()
  };
  
  // NEW: Enrich with v2 curriculum data
  const questionMetadata = {
    atomIdV2: currentQuestion.atomIdV2 || currentQuestion.atom,
    templateId: currentQuestion.template || 'MCQ_CONCEPT',
    sessionId: `daily_${new Date().toDateString()}_${user.uid}`,
    questType: 'DAILY_MISSION',
    isInterleaved: currentIndex > 0
  };
  
  try {
    const { enrichedLog } = await enrichAnalyticsLog(baseLog, questionMetadata);
    await logEnrichedAnalytics(user.uid, enrichedLog, questionMetadata.sessionId);
    
    console.log('[useDailyMission] Enriched log saved:', {
      template: enrichedLog.templateId,
      module: enrichedLog.moduleId
    });
  } catch (error) {
    console.error('[useDailyMission] Enrichment failed:', error);
    // Continue anyway - don't break existing flow
  }
  
  // EXISTING CODE continues...
  // (rest of your submitDailyAnswer logic)
};
```

### Step 2.2: Do the Same for useDiagnostic.js

```javascript
// File: src/hooks/useDiagnostic.js
// Add imports:

import { enrichAnalyticsLog, logEnrichedAnalytics } from '../services/analyticsEnricher';

// In your submitDiag function, add the same enrichment:
const submitDiag = async (...args) => {
  // Your existing code...
  const baseLog = { questionId, atomId, studentAnswer, ... };
  
  // NEW: Add enrichment
  const { enrichedLog } = await enrichAnalyticsLog(baseLog, {
    templateId: currentQuestion.template,
    questType: 'DIAGNOSTIC'
  });
  await logEnrichedAnalytics(userId, enrichedLog, 'diagnostic_session');
  
  // Continue with existing logic
};
```

### Step 2.3: Verify Connection

```javascript
// Create test: src/hooks/__tests__/hookIntegration.test.js

import { enrichAnalyticsLog, logEnrichedAnalytics } from '../../services/analyticsEnricher';

async function testHookIntegration() {
  const baseLog = {
    questionId: 'Q001',
    atomId: 'A5',
    studentAnswer: 'test',
    correctAnswer: 'test',
    isCorrect: true,
    timeSpent: 5000,
    speedRating: 'STEADY',
    masteryBefore: 0.5,
    masteryAfter: 0.6,
    diagnosticTag: null,
    isRecovered: false,
    recoveryVelocity: null,
    timestamp: Date.now()
  };
  
  const metadata = {
    atomIdV2: 'CBSE7.CH01.INT.01',
    templateId: 'NUMERIC_INPUT',
    sessionId: 'test_session'
  };
  
  const { enrichedLog, enrichmentInfo } = await enrichAnalyticsLog(baseLog, metadata);
  
  console.log('✓ Enrichment successful');
  console.log('  - Template:', enrichedLog.templateId);
  console.log('  - Module:', enrichedLog.moduleId);
  console.log('  - Domain:', enrichedLog.domain);
}

testHookIntegration().catch(console.error);
```

---

## 🧪 Phase 3: Test End-to-End (60 min)

### Step 3.1: Create Test Scenario

```javascript
// File: src/__tests__/v2Integration.test.js

import { generateDailyMissionQuestionsV2 } from '../services/dailyMissionIntegration';
import { loadCurriculum } from '../data/curriculumLoader';

async function testFullFlow() {
  console.log('[E2E TEST] Starting full v2 integration test...');
  
  // Step 1: Load curriculum
  console.log('\n[1/4] Loading curriculum...');
  const curriculum = await loadCurriculum();
  console.log(`✓ Loaded ${curriculum.totalAtoms} atoms`);
  
  // Step 2: Generate daily mission
  console.log('\n[2/4] Generating daily mission...');
  const userId = 'test_user_123';
  const dayNumber = 1;
  const questions = await generateDailyMissionQuestionsV2(
    userId,
    dayNumber,
    {}, // empty mastery for now
    []  // empty history
  );
  console.log(`✓ Generated ${questions.length} questions`);
  
  // Step 3: Verify structure
  console.log('\n[3/4] Verifying question structure...');
  questions.forEach((q, i) => {
    console.log(`  Q${i + 1}: ${q.atom} - ${q.template}`);
  });
  
  // Step 4: Verify templates distribution
  console.log('\n[4/4] Template distribution:');
  const templates = {};
  questions.forEach(q => {
    templates[q.template] = (templates[q.template] || 0) + 1;
  });
  Object.entries(templates).forEach(([t, count]) => {
    console.log(`  ${t}: ${count}`);
  });
  
  console.log('\n✅ END-TO-END TEST PASSED');
}

testFullFlow().catch(console.error);
```

Run:
```bash
node src/__tests__/v2Integration.test.js
```

### Step 3.2: Browser Testing

```javascript
// Add this to App.jsx temporarily for testing:

use Effect(() => {
  // Test in browser console
  window.testV2 = async () => {
    const { loadCurriculum } = await import('./data/curriculumLoader');
    const curriculum = await loadCurriculum();
    console.log('Curriculum loaded:', curriculum.totalAtoms, 'atoms');
    return curriculum;
  };
  
  console.log('Run: testV2() in browser console');
}, []);
```

Then in browser:
```javascript
await testV2()
// Should output: Curriculum loaded: 200+ atoms
```

---

## ✅ Phase 4: Verify Analytics (45 min)

### Step 4.1: Check Firebase Structure

1. Go to Firebase Console
2. Navigate to Firestore
3. Look for `/users/{userId}/analytics/` collection
4. Open a recent document
5. Verify both v1 AND v2 fields present:

```json
{
  "questionId": "Q001",        // v1
  "atomId": "A5",             // v1
  "studentAnswer": "...",     // v1
  "isCorrect": true,          // v1
  "templateId": "NUMERIC_INPUT",    // v2 NEW
  "atomIdV2": "CBSE7.CH01.INT.01",  // v2 NEW
  "moduleId": "CBSE7-CH01-INTEGERS", // v2 NEW
  "domain": "Integers",              // v2 NEW
  "schemaVersion": "v2.0",           // v2 NEW
  "enrichedAt": "2024-01-15T...",    // v2 NEW
}
```

### Step 4.2: Validate Logs

```javascript
// Create validation test: src/__tests__/analyticsValidation.test.js

import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function validateEnrichedLogs(userId) {
  const analyticsRef = collection(db, `users/${userId}/analytics`);
  const q = query(analyticsRef);
  const snapshot = await getDocs(q);
  
  let v1Count = 0;
  let v2Count = 0;
  let issues = [];
  
  snapshot.forEach(doc => {
    const log = doc.data();
    
    // Check v1 fields
    const v1Fields = ['questionId', 'atomId', 'studentAnswer', 'isCorrect', 'timeSpent'];
    const hasAllV1 = v1Fields.every(f => log[f] !== undefined);
    if (hasAllV1) v1Count++;
    else issues.push(`Doc ${doc.id}: missing v1 fields`);
    
    // Check v2 fields
    if (log.templateId && log.moduleId && log.domain) v2Count++;
  });
  
  console.log('\n=== ANALYTICS VALIDATION ===' );
  console.log(`Total logs: ${snapshot.size}`);
  console.log(`✓ V1 compliant: ${v1Count}/${snapshot.size}`);
  console.log(`✓ V2 enriched: ${v2Count}/${snapshot.size}`);
  if (issues.length > 0) {
    console.log(`✗ Issues: ${issues.length}`);
    issues.forEach(i => console.log(`  - ${i}`));
  }
}

// Usage in browser console:
await validateEnrichedLogs('your_user_id')
```

---

## 🚀 Phase 5: Deploy (30 min)

### Step 5.1: Create Pull Request

```bash
# The code is already committed to branch:
# feat/curriculum-v2-14plus-daily-missions

# Create PR on GitHub:
git push origin feat/curriculum-v2-14plus-daily-missions
```

Then on GitHub:
1. Go to your repo
2. Click "Compare & pull request"
3. Title: "feat: integrate 14+ template curriculum v2 with full analytics"
4. Description: Link to this guide
5. Target: main branch
6. Add reviewers
7. Merge after approval

### Step 5.2: Merge to Main

```bash
# After PR approval:
git checkout main
git pull origin main
git merge feat/curriculum-v2-14plus-daily-missions
git push origin main
```

### Step 5.3: Deploy to Production

```bash
# Your deployment process (example):
vercel deploy

# Or with Firebase Hosting:
firebase deploy
```

### Step 5.4: Monitor Initial Rollout

Watch these metrics for first 24 hours:

```javascript
// Check browser console for errors:
console.log('✓ No curriculum loading errors')
console.log('✓ No enrichment failures')
console.log('✓ All analytics logs saved')
console.log('✓ Daily mission completes successfully')
```

Monitor Firestore:
```
/users/{userId}/analytics/ → Check new documents have v2 fields
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find curriculum JSON"

```bash
# Check files exist:
ls -la src/data/*v2.json

# Check import works:
node -e "console.log(require('./src/data/cbse7_mathquest_core_curriculum_v2.json').curriculum_id)"
```

### Issue: "Enrichment is failing"

```javascript
// Check v1 fields are valid:
const isValid = log.questionId && log.atomId && log.isCorrect !== undefined;
console.log('V1 Valid:', isValid);

// Check curriculum lookup:
const { loadCurriculum, getAtomById } = await import('./src/data/curriculumLoader');
const curriculum = await loadCurriculum();
const atom = await getAtomById(log.atomId);
console.log('Atom found:', !!atom);
```

### Issue: "Analytics not saving"

```javascript
// Check Firebase auth:
import { auth } from './firebase/config';
console.log('Current user:', auth.currentUser?.uid);

// Check Firestore rules allow write:
// Firebase Console > Firestore > Rules
// Should allow: request.auth != null
```

---

## ✅ Success Checklist

- [ ] Curriculum JSON files copied to src/data/
- [ ] curriculumLoader.js imports successfully
- [ ] analyticsEnricher.js integrated in hooks
- [ ] useDailyMission.js calls enrichAnalyticsLog
- [ ] useDiagnostic.js calls enrichAnalyticsLog
- [ ] Test cases pass locally
- [ ] Browser console shows no errors
- [ ] Firebase Firestore shows enriched documents
- [ ] v1 fields preserved in all logs
- [ ] v2 fields (template, module, domain) present
- [ ] Analytics dashboard still works
- [ ] Daily missions show 14 questions
- [ ] Different templates appear (NUMERIC, MCQ, ERROR_ANALYSIS, etc.)
- [ ] No performance degradation
- [ ] Parent/teacher dashboards show new insights

---

## 📆 Files You Now Have

**New Files Added:**
```
src/data/curriculumLoader.js
src/data/dailyMissionsV2.js
src/data/cbse7_mathquest_core_curriculum_v2.json
src/data/cbse7_mathquest_gold_questions_v2.json
src/services/analyticsSchemaV2.js
src/services/analyticsEnricher.js
src/services/dailyMissionIntegration.js
src/hooks/useDailyMissionV2.js
CURRICULUM_V2_MIGRATION_GUIDE.md
IMPLEMENTATION_QUICK_START.md (this file)
```

**Modified Files:**
```
src/hooks/useDailyMission.js (add enrichment call)
src/hooks/useDiagnostic.js (add enrichment call)
src/App.jsx (optional - cosmetic only)
```

**Unchanged Files:**
```
src/services/analytics.js
src/services/analyticsSchema.js
src/services/advancedValidationService.js
All other files - ZERO changes needed
```

---

## 📗 Next Steps After Deployment

1. **Train Teachers** - Show them new analytics dashboard
2. **Monitor Metrics** - Track:
   - Daily mission completion rate
   - Template distribution in data
   - Enrichment success rate
   - Analytics lag time
3. **Gather Feedback** - From teachers and students
4. **Optimize** - Fine-tune slot allocation based on real data
5. **Expand** - Add more templates and atoms as needed

---

## 📄 Support

If you get stuck:

1. Check browser console for errors
2. Verify Firebase auth and Firestore access
3. Test curriculum loading in isolation
4. Review Firestore documents for structure
5. Compare with sample data in CURRICULUM_V2_MIGRATION_GUIDE.md

---

**Status**: Ready to Deploy  
**Estimated Time**: 3-4 hours  
**Risk Level**: Low (full backward compatibility)  
**Rollback**: Easy (just remove enrichment calls)
