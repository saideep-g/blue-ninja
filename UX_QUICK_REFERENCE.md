# 🎨 World-Class UX Quick Reference Card

## Copy-Paste Solutions

Use these exact patterns for any template redesign.

---

## 💺 Main Layout

```jsx
<div className="w-full space-y-8 flex flex-col">
  {/* Question - HERO */}
  <div className="space-y-4">
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
      {prompt}
    </h2>
    {instruction && (
      <p className="text-base text-gray-600 leading-relaxed">
        {instruction}
      </p>
    )}
  </div>

  {/* Interaction - FOCUS */}
  <div className="space-y-3 flex-1">
    {/* Your options/inputs here */}
  </div>

  {/* Submit - OBVIOUS */}
  {!submitted && (
    <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50">
      Check Answer
    </button>
  )}

  {/* Feedback - ENCOURAGING */}
  {submitted && feedback && (
    <div className={`p-5 md:p-6 rounded-xl flex gap-4 ${
      feedback.isCorrect
        ? 'bg-green-50 border-2 border-green-200'
        : 'bg-blue-50 border-2 border-blue-200'
    }`}>
      {feedback.isCorrect ? (
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
      ) : (
        <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0" />
      )}
      <p className={feedback.isCorrect ? 'text-green-900' : 'text-blue-900'}>
        {feedback.feedback}
      </p>
    </div>
  )}

  {/* Solution - COLLAPSIBLE */}
  {submitted && question.workedSolution?.steps && (
    <details className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 md:p-6 rounded-xl border-2 border-purple-200 group">
      <summary className="cursor-pointer font-bold flex items-center gap-2 hover:text-purple-600">
        📖 Step-by-step solution
        <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="mt-4 space-y-3">
        {question.workedSolution.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {idx + 1}
            </div>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              {step}
            </p>
          </div>
        ))}
      </div>
    </details>
  )}
</div>
```

---

## 🗣️ Feedback Messages

### ✅ Correct Answer
```javascript
const correctFeedback = [
  "Perfect! That's exactly right!",
  "Excellent! Your reasoning is spot on!",
  "Great work! You've got it!",
  "Amazing! That's the correct answer!",
  "That's right! Well done!",
]
```

### 💡 Incorrect Answer
```javascript
const incorrectFeedback = [
  "Great thinking! Let's explore this more.",
  "Good attempt! Try a different approach.",
  "You're on the right track! Think about this...",
  "That's one way to look at it. Consider...",
  "Nice try! Let me show you another perspective.",
]
```

### 📊 Learning Hints
```javascript
const hints = [
  "💡 Tip: Think about the relationship between...",
  "🧐 Hint: What happens when you...",
  "🔌 Try breaking this into smaller steps:",
  "📚 Remember that...",
  "🎯 Consider the pattern in...",
]
```

---

## 🖅️ Option/Button Patterns

### Large Option Button
```jsx
<button
  onClick={() => handleSelect(index)}
  disabled={submitted || isSubmitting}
  className={`w-full p-4 md:p-5 rounded-xl border-2 text-left transition-all font-medium text-base md:text-lg ${
    isSelected
      ? 'border-blue-500 bg-blue-50 text-gray-900 shadow-md'
      : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300 hover:bg-blue-50'
  } ${submitted || isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
>
  <div className="flex items-center gap-4">
    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
      isSelected
        ? 'border-blue-500 bg-blue-500'
        : 'border-gray-300 bg-white'
    }`}>
      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
    </div>
    <span>{option.text}</span>
  </div>
</button>
```

### Large Input Field
```jsx
<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  autoFocus
  className="flex-1 px-5 py-4 md:py-5 border-2 border-blue-300 rounded-xl text-lg md:text-xl font-semibold bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
/>
```

### Large Submit Button
```jsx
<button
  onClick={handleSubmit}
  disabled={value.trim() === '' || isSubmitting}
  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting ? 'Checking...' : 'Check Answer'}
</button>
```

---

## 🎈 Icon References

```javascript
import { CheckCircle2, XCircle, Lightbulb, AlertCircle, ChevronRight } from 'lucide-react';

// Use these
<CheckCircle2 className="w-6 h-6 text-green-600" />  // Correct
<Lightbulb className="w-6 h-6 text-blue-600" />      // Learning
<AlertCircle className="w-6 h-6 text-yellow-600" />  // Warning
χ <XCircle className="w-6 h-6 text-red-600" />       // DON'T USE for feedback
```

---

## 🏺 Color Palette

### Blues (Primary, Trust, Focus)
```tailwind
bg-blue-50   text-blue-50      /* Very light background */
bg-blue-100  text-blue-100     /* Light background */
bg-blue-500  text-blue-500     /* Primary action */
bg-blue-600  text-blue-600     /* Hover state */
bg-blue-700  text-blue-700     /* Active state */
```

### Greens (Success, Correct)
```tailwind
bg-green-50    text-green-50     /* Success background */
bg-green-200   text-green-200    /* Success border */
bg-green-600   text-green-600    /* Success icon */
```

### Blues for Learning (Not Red for Wrong!)
```tailwind
bg-blue-50     /* Learning feedback background */
bg-blue-200    /* Learning feedback border */
text-blue-600  /* Learning icon (lightbulb) */
```

### Purples (Secondary, Progressive)
```tailwind
bg-purple-50   text-purple-50   /* Subtle background */
bg-purple-600  text-purple-600  /* Step numbers */
```

### Grays (Text, Borders)
```tailwind
text-gray-500  /* Muted labels */
text-gray-600  /* Secondary text */
text-gray-700  /* Body text */
text-gray-900  /* Headlines */
text-gray-400  /* Disabled */
```

---

## 💲 Spacing System

```tailwind
/* Space between sections */
space-y-8          /* Large gap (primary) */
space-y-4          /* Medium gap */
space-y-3          /* Small gap (tight options) */

/* Padding inside elements */
p-4 md:p-5         /* Options/buttons */
p-5 md:p-6         /* Cards/feedback */
p-8 md:p-12        /* Large content areas */

/* Height */
py-4 md:py-5       /* Standard button height */
min-h-32           /* Minimum textarea height */
```

---

## 📚 Typography

```tailwind
/* Questions */
text-2xl md:text-3xl font-bold      /* Hero question */
leading-tight                       /* Compact line height */

/* Instructions */
text-base text-gray-600             /* Secondary info */
leading-relaxed                     /* Readable paragraphs */

/* Options/Buttons */
text-base md:text-lg font-medium    /* Easy to read, touch */

/* Feedback */
text-base md:text-lg font-semibold  /* Emphasis and clarity */

/* Labels */
text-xs font-semibold uppercase     /* Small, distinct */
tracking-wide                       /* Letter spacing */
```

---

## 💵 Transitions & Animations

```tailwind
transition-all duration-200         /* Smooth state changes */
transition-colors duration-200      /* Color shifts */
transition-transform                /* Rotation (chevron) */
group-open:rotate-180               /* Chevron rotation */
hover:shadow-lg                     /* Depth on hover */
hover:border-blue-300               /* Subtle hover states */
```

---

## ✅ Accessibility Checklist

```javascript
// MUST HAVE
<button disabled={...}>              // Disabled state support
<input autoFocus />                 // Keyboard navigation
onKeyPress={(e) => { ... }}         // Enter key support

// SHOULD HAVE  
className="focus:ring-2"            // Focus indicator
className="focus:outline-none"      // Remove browser outline
<label htmlFor="input">             // Form labels

// NICE TO HAVE
aria-label="..."                    // Screen reader labels
role="button"                       // Semantic roles
```

---

## 📖 Template Structure Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SPACE-Y-8 (Main Layout)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

┃
┃ 📃 QUESTION (Hero)
┃    text-2xl md:text-3xl font-bold
┃    + instruction text-base text-gray-600
┃
━━━━━━━━━━━━━━━━━━━━━━━━━━━

┃
┃ 🔖 INTERACTION (Space-y-3)
┃    Option buttons p-4 md:p-5 or input py-4 md:py-5
┃
━━━━━━━━━━━━━━━━━━━━━━━━━━━

┃
┃ 🟠 SUBMIT BUTTON
┃    w-full py-4 gradient-to-r from-blue-500 to-blue-600
┃
━━━━━━━━━━━━━━━━━━━━━━━━━━━

┃
┃ 💫 FEEDBACK (Encouraging)
┃    bg-green-50/blue-50 + CheckCircle2/Lightbulb
┃
━━━━━━━━━━━━━━━━━━━━━━━━━━━

┃
┃ 📖 SOLUTION (Collapsible)
┃    <details> with step numbers in circles
┃
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔓 Common Mistakes to Avoid

❌ Don't: Harsh feedback language
```javascript
// WRONG
<p>✗ Incorrect! Try again!</p>

// RIGHT
<Lightbulb /> "Great thinking! Try..."
```

❌ Don't: Show metadata
```javascript
// WRONG
<span>Difficulty: Hard</span>
<span>Atom: Plan-Solve-Check</span>

// RIGHT
// (Don't show anything)
```

❌ Don't: Cram everything on screen
```javascript
// WRONG
return (
  <div><Question /></div>
  <div><Options /></div>
  <div><Metadata /></div>
  <div><Solution /></div>
)  // All visible at once

// RIGHT
return (
  <div className="space-y-8 flex flex-col">
    <Question />
    <Options />
    {submitted && <Feedback />}
    {submitted && <CollapsibleSolution />}
  </div>
)
```

❌ Don't: Small input areas
```javascript
// WRONG
<button className="p-2">Submit</button>
<input className="py-1" />

// RIGHT
<button className="py-4 md:py-5">Submit</button>
<input className="py-4 md:py-5" />
```

❌ Don't: Use red X marks
```javascript
// WRONG
<XCircle className="text-red-600" />

// RIGHT
<Lightbulb className="text-blue-600" />
```

---

## 🙋 Need Help?

1. **Stuck on layout?** Copy the main layout template above
2. **Need icons?** Import from `lucide-react`
3. **Colors wrong?** Use the palette above (never harsh red for wrong)
4. **Feedback tone?** Check the feedback messages list
5. **Mobile broken?** Check all `md:` breakpoints are present

**Remember:** If in doubt, think like a 13-year-old. Is this clear? Am I anxious? Can I tap/click easily? Good! 🈟

---

**Last Updated:** 2025-12-27
**Status:** ✅ Ready for production
**Time Saved:** You're welcome! 🚀