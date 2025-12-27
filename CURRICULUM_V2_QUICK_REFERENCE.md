# Curriculum v2 - Quick Reference Card

## TL;DR - The 4 Files

| File | Purpose | Use When | DON'T Use For |
|------|---------|----------|---------------|
| **Manifest** (Doc0) | Version lock & index | Starting app, validating bundle | Curriculum navigation |
| **Core** (Doc1) | Learning map | Building skill trees, UI navigation | Template rendering, mastery rules |
| **Templates** (Doc2) | UI & grading contracts | Rendering questions, grading answers | Curriculum hierarchy, mastery |
| **Assessment** (Doc3) | Engine room | Mastery thresholds, sequencing, analytics | Curriculum structure, UI rendering |

---

## Quick Access Pattern

```javascript
// 1. Always use the service (loads all 4 files)
const curriculum = await curriculumV2Service.loadCurriculumV2();

// 2. Access data from unified object
curriculum.modules          // From Doc1
curriculum.atoms            // From Doc1 (indexed)
curriculum.templates        // From Doc2
curriculum.masteryProfiles  // From Doc3
```

---

## Common Tasks

### Display Curriculum Hierarchy
```javascript
// This uses Doc1 (Core Curriculum)
const curriculum = await curriculumV2Service.loadCurriculumV2();
curriculum.modules.forEach(module => {
  console.log(module.title);  // Chapter 1: Integers
  module.atoms.forEach(atom => {
    console.log(atom.title);  // Adding Integers
  });
});
```

### Get Template Definition
```javascript
// This uses Doc2 (Template Library)
const template = await curriculumV2Service.getTemplateDefinition('MCQ_CONCEPT');
console.log(template.display_name);      // "Multiple Choice - Conceptual"
console.log(template.scoring_model);     // How to grade
console.log(template.telemetry_events);  // What to track
```

### Get Mastery Thresholds
```javascript
// This uses Doc3 (Assessment Guide)
const mastery = await curriculumV2Service.getMasteryProfile('MP_CORE_FLUENCY');
console.log(mastery.thresholds.mastery);  // 0.95 (95% = mastery)
```

### Get Atom Details (All Metadata)
```javascript
// Returns Doc1 metadata + Doc2 templates + Doc3 mastery profile
const atom = curriculum.atoms['CBSE7.CH01.INT.01'];
console.log(atom.title);                    // From Doc1
console.log(atom.template_ids);             // From Doc1 (references to Doc2)
console.log(atom.mastery_profile_id);       // From Doc1 (references to Doc3)
console.log(atom.outcomes);                 // From Doc1
console.log(atom.misconception_ids);        // From Doc1 (references to Doc3)
```

### Get All Enriched Atoms
```javascript
// Returns atoms with full template & mastery definitions expanded
const enriched = await curriculumV2Service.getAllAtomsEnriched();
enriched.forEach(atom => {
  console.log(atom.title);                 // From Doc1
  console.log(atom.templates);             // Full Doc2 definitions
  console.log(atom.masteryProfile);        // Full Doc3 definition
});
```

### Get Statistics
```javascript
// Summary of entire curriculum
const stats = await curriculumV2Service.getCurriculumStats();
console.log(stats.totalModules);           // 13
console.log(stats.totalAtoms);             // 200+
console.log(stats.totalTemplates);         // 17
console.log(stats.templateDistribution);   // {MCQ_CONCEPT: 45, NUMERIC_INPUT: 38, ...}
```

---

## File Paths

```
src/data/
├── cbse7_mathquest_manifest_v2.json              (Doc0)
├── cbse7_mathquest_core_curriculum_v2.json       (Doc1)
├── mathquest_template_library_v2.json            (Doc2)
├── cbse7_mathquest_assessment_guide_v2.json      (Doc3)
└── curriculumLoader.js

src/services/
└── curriculumV2Service.js                       (Orchestration)

src/components/curriculum/
└── CurriculumBrowser.jsx                        (Updated ✓)
```

---

## Validation Rules

✅ **MUST LOAD**
- Manifest first (validates bundle)
- All 4 files together (they're coupled by version_lock)

✅ **MUST USE**
- curriculumV2Service for all access
- IDs to reference across files (don't embed full objects)

❌ **MUST NOT**
- Mix v1 and v2 files
- Load individual files (use service)
- Hardcode template/mastery IDs
- Modify files directly

---

## Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module..." | Missing file in src/data | Check file names match exactly |
| "Version mismatch" | Manifest version_lock doesn't match file versions | Update manifest version_lock |
| "Template X not found" | Doc1 atom references Doc2 ID that doesn't exist | Add template to Doc2 |
| "Mastery profile X not found" | Doc1 atom references Doc3 ID that doesn't exist | Add profile to Doc3 |
| "Undefined atoms" | Curriculum not loaded yet | Use `await curriculumV2Service.loadCurriculumV2()` first |

---

## CurriculumBrowser Features (Updated ✓)

✅ Loads all 4 curriculum files
✅ Displays modules → atoms hierarchy
✅ Shows learning outcomes (from Doc1)
✅ Shows supported templates (from Doc1 + Doc2 definitions)
✅ Shows misconceptions (from Doc1 references)
✅ Shows mastery profile (from Doc1 reference + Doc3 definition)
✅ Shows prerequisites (from Doc1)
✅ Search functionality
✅ View mode toggle (hierarchy/grid)
✅ Statistics dashboard
✅ Curriculum stats (modules, atoms, templates)

---

## Next Steps (Not Yet Updated)

These components should be updated to use v2 service:

- [ ] DailyMissionGenerator.jsx
  - Use Doc3 sequencing rules
  - Use Doc3 spaced review rules
  - Reference Doc1 atoms properly
  - Select templates from Doc2

- [ ] QuestionRenderer.jsx
  - Use Doc2 payload contracts
  - Use Doc2 scoring models
  - Use Doc2 telemetry_events

- [ ] Analytics service
  - Use Doc2 telemetry_events schema
  - Use Doc3 analytics_event_specs
  - Enrich events with Doc1 atom metadata

- [ ] AI Question Generator
  - Use Doc3 prompt_recipes
  - Use Doc3 cognitive_levels
  - Generate questions matching Doc2 payload contract

---

## Code Template

For any new component using curriculum:

```javascript
import curriculumV2Service from '../../services/curriculumV2Service';

// In component
const [curriculum, setCurriculum] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const loaded = await curriculumV2Service.loadCurriculumV2();
      setCurriculum(loaded);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadCurriculum();
}, []);

if (loading) return <Loading />;
if (error) return <Error message={error} />;

return (
  <div>
    {/* Use curriculum object */}
    {curriculum?.modules.map(module => (...))}
  </div>
);
```

---

## Debug Tips

```javascript
// See full curriculum structure
const debug = await curriculumV2Service.getCurriculumDebugInfo();
console.log(debug);

// Check specific atom
const atom = await curriculumV2Service.getAtomById('CBSE7.CH01.INT.01');
console.log('Atom:', atom);
console.log('Templates:', atom.template_ids?.map(id => curriculum.templates[id]));
console.log('Mastery:', await curriculumV2Service.getMasteryProfile(atom.mastery_profile_id));

// Check template
const template = await curriculumV2Service.getTemplateDefinition('MCQ_CONCEPT');
console.log('Template:', template);

// Get atoms using specific template
const atoms = await curriculumV2Service.getAtomsForTemplate('MCQ_CONCEPT');
console.log(`Found ${atoms.length} atoms using MCQ_CONCEPT`);
```

---

## Version Info

- **Curriculum Version**: v2.0
- **Schema Version**: 2.0 (all 4 files)
- **Bundle ID**: cbse7_mathquest_v2_202401
- **Grade Levels**: 7, 8, 9
- **Syllabi**: CBSE
- **Last Updated**: December 2024

---

## Related Documentation

- **CURRICULUM_V2_COMPLETE_GUIDE.md** - Deep dive into each file
- **IMPLEMENTATION_QUICK_START.md** - Step-by-step deployment
- **DEPLOYMENT_EXECUTIVE_SUMMARY.txt** - High-level overview

---

**Remember**: All 4 files are coupled by version_lock. Always load them together via curriculumV2Service! ✓
