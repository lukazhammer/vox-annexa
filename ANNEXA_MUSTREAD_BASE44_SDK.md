# CLAUDE.md - Annexa Development Reference

**Base44 SDK Boundaries & Safe Modification Guide**  
Last Updated: February 8, 2026

---

## 🚫 NEVER TOUCH - Auto-Generated Files

These files are managed by Base44's build system. Modifications will be overwritten.

| File | Why It's Protected | What Happens If You Edit |
|------|-------------------|-------------------------|
| `src/pages.config.js` | Auto-generated from `src/pages/` folder structure | Your changes disappear on next build |
| `components.json` | shadcn/ui configuration managed by CLI | Component imports break |
| `src/lib/app-params.js` | Base44 SDK parameter handling | Authentication breaks |

**Rule:** If a file has a comment like `// AUTO-GENERATED` or `// DO NOT EDIT`, don't edit it.

---

## ✅ SAFE TO MODIFY - Full Control

These files are yours to customize without breaking Base44 compatibility.

### Pages (`src/pages/*.jsx`)
```
src/pages/
├── Home.jsx              ✅ Landing page content
├── Form.jsx              ✅ Main wizard (1207 lines)
├── Preview.jsx           ✅ Document preview
├── DataRequest.jsx       ✅ GDPR form
├── AnnexaPrivacy.jsx     ✅ Privacy policy
├── AnnexaTerms.jsx       ✅ Terms of service
└── AnnexaCookies.jsx     ✅ Cookie policy
```

**How Routing Works:**
- Base44 auto-scans `src/pages/` folder
- Generates routes based on filename: `Home.jsx` → `/`
- To add a page: create `NewPage.jsx`, export default component
- To remove a page: delete the file

### Custom Components (`src/components/*.jsx`)
```
src/components/
├── CompetitiveIntelligence.jsx  ✅ Competitor analysis UI
├── DocumentTypeSelection.jsx    ✅ Document picker
├── DynamicFields.jsx             ✅ Form field rendering
├── FieldWrapper.jsx              ✅ Input wrapper
├── FormNavigation.jsx            ✅ Wizard navigation
├── FormSection.jsx               ✅ Section container
├── GeolocationButton.jsx         ✅ Location detection
├── HeroSection.jsx               ✅ Homepage hero
├── LoadingState.jsx              ✅ Loading spinner
├── ProgressBar.jsx               ✅ Form progress
├── ProgressSaver.jsx             ✅ Draft save UI
├── SectionHeader.jsx             ✅ Section titles
├── SocialProof.jsx               ✅ Social proof badges
└── WizardProgress.jsx            ✅ Step indicator
```

**All 14 custom components = fully editable**

### UI Components (`src/components/ui/*.jsx`)
```
shadcn/ui components (49 files)
✅ Safe to modify styling
✅ Safe to add new variants
⚠️  Keep Radix UI props intact
```

### Serverless Functions (`functions/*.ts`)
```
functions/
├── generateDocuments.ts          ✅ Main doc generation
├── enhanceWithAI.ts              ✅ AI enhancement
├── analyzeCompetitor.ts          ✅ Competitor analysis
├── transformProductDescription.ts ✅ Description refinement
├── scanWebsite.ts                ✅ Website crawler
├── detectJurisdiction.ts         ✅ Legal jurisdiction
├── detectLocation.ts             ✅ User location
├── saveProgress.ts               ✅ Draft save + email
├── loadProgress.ts               ✅ Load drafts
├── emailDocuments.ts             ✅ Email delivery
├── emailLaunchKit.ts             ✅ Launch kit email
├── generatePDF.ts                ✅ PDF generation
├── generateMarkdownZip.ts        ✅ ZIP export
├── submitDataRequest.ts          ✅ GDPR requests
├── sendPremiumConfirmation.ts    ✅ Premium confirmation
├── sendPremiumUpsell.ts          ✅ Upsell email
└── sendProgressEmail.ts          ✅ Progress reminder
```

**All 17 functions = fully editable**

**Function Runtime:** Deno (not Node.js)
- Use `Deno.env.get()` not `process.env`
- TypeScript by default
- Top-level await supported

### Styling Files
```
src/index.css           ✅ Global styles, CSS variables
tailwind.config.js      ✅ Tailwind configuration
```

### Layout & Structure
```
src/Layout.jsx          ✅ Header, footer, navigation
src/App.jsx             ✅ App-level logic
src/main.jsx            ⚠️  Entry point (modify carefully)
```

---

## ⚠️ MODIFY WITH CAUTION

These files work but require understanding of Base44 patterns.

### `src/api/base44Client.js`
**What it does:** Initializes Base44 SDK client

```javascript
export const base44 = createClient({
  appId,              // From VITE_BASE44_APP_ID
  token,              // From localStorage
  functionsVersion,   // From VITE_BASE44_FUNCTIONS_VERSION
  serverUrl: '',      // ⚠️  Keep empty for Base44 defaults
  requiresAuth: false, // ⚠️  Public access - change breaks auth
  appBaseUrl          // Backend URL
});
```

**Safe changes:**
- ✅ Add custom client methods
- ✅ Add error interceptors

**Dangerous changes:**
- ❌ Change `serverUrl` (breaks function calls)
- ❌ Change `requiresAuth` (breaks public access)

### `src/lib/AuthContext.jsx`
**What it does:** Manages user authentication state

**Safe changes:**
- ✅ Add custom auth logic
- ✅ Extend user object with additional fields

**Dangerous changes:**
- ❌ Change `useAuth` hook signature (breaks components)
- ❌ Remove `redirectToLogin()` (breaks protected routes)

### `vite.config.js`
**What it does:** Build configuration + Base44 plugin

```javascript
base44({
  legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
  hmrNotifier: true,           // Hot reload notifications
  navigationNotifier: true,    // Navigation logging
  visualEditAgent: true        // Visual editing in Base44 UI
})
```

**Safe changes:**
- ✅ Add Vite plugins
- ✅ Add build optimizations

**Dangerous changes:**
- ❌ Remove `base44()` plugin (breaks entire app)
- ❌ Change plugin order (can break HMR)

---

## 📦 Adding New Files

### Adding a New Page
```bash
# 1. Create file in src/pages/
touch src/pages/NewPage.jsx

# 2. Export default component
export default function NewPage() {
  return <div>New Page</div>;
}

# 3. Base44 auto-generates route
# Restart dev server to see changes
npm run dev
```

**Route mapping:**
- `Home.jsx` → `/` (special case)
- `About.jsx` → `/About`
- `ContactUs.jsx` → `/ContactUs`

### Adding a New Function
```bash
# 1. Create file in functions/
touch functions/newFunction.ts

# 2. Export default handler
export default async function handler(req: Request) {
  return new Response(JSON.stringify({ success: true }));
}

# 3. Call from frontend
import { base44 } from '@/api/base44Client';
const result = await base44.functions.invoke('newFunction', { data });
```

### Adding a New Component
```bash
# 1. Create in src/components/
touch src/components/NewComponent.jsx

# 2. Import with @ alias
import NewComponent from '@/components/NewComponent';
```

---

## 🔧 SDK Patterns to Preserve

### Function Invocation
**Always use this pattern:**
```javascript
import { base44 } from '@/api/base44Client';

const result = await base44.functions.invoke('functionName', {
  param1: 'value',
  param2: 123
});
```

**Never use:**
```javascript
// ❌ Direct fetch to functions
fetch('/api/functionName')

// ❌ Custom function wrapper
callMyFunction('functionName')
```

### Import Aliases
**Always use `@/` for imports:**
```javascript
import Component from '@/components/Component';  // ✅
import Component from '../components/Component'; // ❌
```

Configured in `jsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Environment Variables
**Frontend (Vite):**
```javascript
const appId = import.meta.env.VITE_BASE44_APP_ID;  // ✅
const appId = process.env.VITE_BASE44_APP_ID;      // ❌
```

**Functions (Deno):**
```typescript
const apiKey = Deno.env.get('GEMINI_API_KEY');  // ✅
const apiKey = process.env.GEMINI_API_KEY;      // ❌
```

---

## 🎨 Brand Compliance Rules

### Banned Words - Never Use
```
seamless, powerful, robust, leverage, solution,
unlock, elevate, streamline, game-changer
```

**Violations detected in codebase:**
- `CompetitiveIntelligence.jsx:331` - "Unlock" → use "Access"
- `Form.jsx:938` - "solutions" → use "alternatives"

### Typography Enforcement
```css
/* Headlines */
font-family: 'Caudex', serif;

/* Body text */
font-family: 'Poppins', sans-serif;
```

**Implemented in:** `src/Layout.jsx:22-31`

### Color System
```javascript
// Accent color
--accent: #C24516;        // burnt sienna
--accent-dark: #A03814;   // darker variant

// Background
--background: #09090B;    // near-black

// Text
--foreground: #faf7f2;    // warm white
```

**Implementation:** `src/index.css`

---

## 🚀 Deployment Workflow

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Test production build
npm run lint         # Check for errors
```

### Re-importing to Base44

**Step 1: Commit changes**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

**Step 2: Base44 auto-syncs**
- Changes appear in Base44 Builder immediately
- No manual upload required

**Step 3: Publish**
- Click "Publish" in Base44 UI
- Deployment happens automatically

**Build process:**
1. Base44 runs `npm run build`
2. Generates `pages.config.js` from `src/pages/`
3. Bundles functions for Deno runtime
4. Deploys to edge network

---

## 🔍 Debugging Tips

### "Function not found" error
**Cause:** Function file doesn't export default handler  
**Fix:** Add `export default async function handler(req) { ... }`

### "Page not loading" error
**Cause:** Page component not exported as default  
**Fix:** Ensure `export default function PageName() { ... }`

### "Import path not found"
**Cause:** Using relative imports instead of `@/` alias  
**Fix:** Change `../components/X` to `@/components/X`

### "Auth required" error in public pages
**Cause:** `requiresAuth: true` in `base44Client.js`  
**Fix:** Set to `requiresAuth: false` for public access

### Cache not persisting across function calls
**Cause:** In-memory `Map()` cache resets on cold starts  
**Fix:** Migrate to Vercel KV (see optimization guide)

---

## 📚 Additional Resources

### Base44 Documentation
- SDK Reference: Check Base44 docs for latest API
- Function Runtime: Deno runtime documentation
- Visual Edit Agent: Base44's WYSIWYG editor

### Related Files in This Repo
- `annexa-analysis-report.md` - Complete codebase analysis
- `annexa-codebase-analysis-prompt.md` - Analysis methodology
- `.env.example` - Required environment variables (create this!)

### Vox Animus Context
- Project files in `/mnt/project/`
- Brand guidelines: `vox-animus-brand-guidelines.md`
- Master context: `VOX_ANIMUS_MASTER_CONTEXT.md`

---

## 🎯 Quick Reference Checklist

Before making changes:
- [ ] File on "Never Touch" list? → Don't edit
- [ ] Need to add a page? → Create in `src/pages/`
- [ ] Need to add a function? → Create in `functions/`
- [ ] Using banned words? → Replace with approved alternatives
- [ ] Hardcoding secrets? → Use environment variables
- [ ] Using `process.env`? → Use `Deno.env.get()` in functions
- [ ] Import with `../`? → Use `@/` alias instead

Before deploying:
- [ ] Run `npm run build` successfully
- [ ] Check for banned words in new copy
- [ ] Test all modified pages locally
- [ ] Verify functions work in isolation
- [ ] Check brand compliance (colors, fonts)

---

**Last Updated:** February 8, 2026  
**Maintained By:** Lucas Werner  
**For:** Annexa (Vox Animus ecosystem)
