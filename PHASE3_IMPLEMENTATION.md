# Phase 3: Notes Workspace Features - Implementation Plan

## Overview
Phase 3 focuses on transforming the notes workspace into a professional, feature-rich editing environment with auto-save, enhanced organization, and improved user experience.

## Feature Breakdown

### 1. Auto-Save Functionality (Priority: CRITICAL) ⚡

**Current State**: 
- Notes save on title/content change via `persistNote()`
- No debouncing - saves immediately on every keystroke
- No visual feedback for save status
- User doesn't know if note is saved

**Implementation**:
```typescript
// apps/web/src/app/(app)/notes/[id]/page.tsx

// Add debounce helper
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Save status indicator
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

// Debounced save function
const debouncedSave = useCallback(
  debounce((title: string, content: string) => {
    setSaveStatus('saving');
    persistNote(title, content);
    setTimeout(() => setSaveStatus('saved'), 500);
  }, 1500), // Save after 1.5 seconds of inactivity
  [persistNote]
);

// Use in handlers
const handleTitleChange = (newTitle: string) => {
  setTitle(newTitle);
  setSaveStatus('unsaved');
  debouncedSave(newTitle, contentRef.current);
};

// Show save status in UI
<span className={`text-sm flex items-center gap-1 ${
  saveStatus === 'saving' ? 'text-yellow-600' :
  saveStatus === 'unsaved' ? 'text-red-600' :
  'text-gray-500'
}`}>
  {saveStatus === 'saving' && <Loader size={14} className="animate-spin" />}
  {saveStatus === 'saving' ? 'Saving...' :
   saveStatus === 'unsaved' ? 'Unsaved changes' :
   'Saved'}
</span>
```

**Files to modify**:
- `apps/web/src/app/(app)/notes/[id]/page.tsx` - Add debounce and save status

**Estimated time**: 30 minutes

---

### 2. Tag Management UI (Priority: HIGH) 🏷️

**Current State**:
- Tags exist in API
- No UI to create/edit/delete tags
- Tags can't be assigned to notes from editor
- Filter by tags in notes list

**Implementation**:
```typescript
// New component: apps/web/src/components/TagManager.tsx

export default function TagManager({ 
  noteId, 
  currentTags, 
  onTagsChange 
}: {
  noteId: string;
  currentTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Load all tags on mount
  useEffect(() => {
    const session = getSession();
    if (session?.token) {
      getTags(session.token).then(setAvailableTags);
    }
  }, []);

  // Create new tag
  const handleCreateTag = async () => {
    const session = getSession();
    if (session?.token && newTagName.trim()) {
      const tag = await createTag(session.token, newTagName);
      setAvailableTags([...availableTags, tag]);
      setNewTagName('');
    }
  };

  // Add tag to note
  const handleAddTag = (tag: Tag) => {
    if (!currentTags.find(t => t.id === tag.id)) {
      onTagsChange([...currentTags, tag]);
    }
  };

  // Remove tag from note
  const handleRemoveTag = (tagId: string) => {
    onTagsChange(currentTags.filter(t => t.id !== tagId));
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-3">Tags</h3>
      
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {currentTags.map(tag => (
          <span key={tag.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
            {tag.name}
            <button onClick={() => handleRemoveTag(tag.id)}>✕</button>
          </span>
        ))}
      </div>

      {/* Add tag */}
      <div className="flex gap-2 mb-4">
        <input 
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Add new tag..."
          className="flex-1 px-3 py-2 border rounded text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
        />
        <button 
          onClick={handleCreateTag}
          className="px-3 py-2 bg-indigo-600 text-white rounded text-sm"
        >
          +
        </button>
      </div>

      {/* Available tags */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags
            .filter(t => !currentTags.find(ct => ct.id === t.id))
            .map(tag => (
              <button
                key={tag.id}
                onClick={() => handleAddTag(tag)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
              >
                {tag.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
```

**API functions needed** (add to `apps/web/src/lib/api.ts`):
```typescript
export async function getTags(token: string) {
  const res = await fetch(`${API_BASE}/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTag(token: string, name: string) {
  const res = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteTag(token: string, tagId: string) {
  const res = await fetch(`${API_BASE}/tags/${tagId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

**Files to create/modify**:
- `apps/web/src/components/TagManager.tsx` - NEW
- `apps/web/src/lib/api.ts` - Add tag functions
- `apps/web/src/app/(app)/notes/[id]/page.tsx` - Integrate TagManager

**Estimated time**: 45 minutes

---

### 3. Enhanced Editor Features (Priority: MEDIUM) ✨

**Improvements**:
- Code block syntax highlighting
- Better markdown formatting
- Character count display
- Reading time estimate
- Keyboard shortcuts help

**Implementation**:
```typescript
// Update TipTapEditor to include more extensions

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

// Add these extensions
const extensions = [
  StarterKit.configure({
    codeBlock: false, // Use CodeBlockLowlight instead
  }),
  CodeBlockLowlight.configure({
    lowlight: createLowlight(),
  }),
  Highlight,
  Typography,
  Link.configure({
    openOnClick: true,
  }),
  Image,
];
```

**Files to modify**:
- `apps/web/src/components/editor/TipTapEditor.tsx` - Add extensions
- `apps/web/src/components/editor/MenuBar.tsx` - Add more formatting options

**Estimated time**: 30 minutes

---

### 4. Version History (Priority: LOW) 📜

**Current State**:
- No version history
- Can't restore previous versions
- Only one note content stored

**Implementation**:
- Save snapshots on major edits (every 5 minutes or on manual save)
- Store in local storage with timestamps
- Show version timeline in sidebar
- Allow restore with confirmation

**Database schema needed**:
```prisma
model NoteVersion {
  id        String    @id @default(cuid())
  noteId    String
  note      Note      @relation(fields: [noteId], references: [id], onDelete: Cascade)
  title     String
  content   String    @db.Text
  createdAt DateTime  @default(now())
  
  @@index([noteId])
  @@index([createdAt])
}
```

**Estimated time**: 60 minutes (backend + frontend)

---

## Implementation Order

1. **Step 1**: Auto-Save (30 min) - Foundation for other features
2. **Step 2**: Tag Management (45 min) - Improves organization
3. **Step 3**: Enhanced Editor (30 min) - Better UX
4. **Step 4**: Version History (60 min) - Advanced feature

**Total: ~2.5 hours of active development**

---

## Backend API Verification

### Required endpoints (verify these exist):
- ✅ `GET /api/tags` - List user's tags
- ✅ `POST /api/tags` - Create new tag
- ✅ `PUT /api/tags/:id` - Update tag
- ✅ `DELETE /api/tags/:id` - Delete tag
- ✅ `POST /api/notes/:id/tags` - Assign tags to note
- ✅ `DELETE /api/notes/:id/tags/:tagId` - Remove tag from note

### Schema check needed:
```bash
# Check current schema
cd apps/api
npx prisma db push
npx prisma studio  # Visual inspection
```

---

## Testing Checklist

After each feature implementation:

- [ ] Test locally with `npm run dev`
- [ ] Auto-save status displays correctly
- [ ] Tags can be created/added/removed
- [ ] Editor formatting works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Keyboard shortcuts work
- [ ] Performance is acceptable

---

## Deployment Strategy

1. ✅ Develop locally (npm run dev)
2. ✅ Test thoroughly
3. ✅ Commit to feature branch
4. ✅ Push to GitHub
5. ✅ Deploy to Vercel
6. ✅ Test in production
7. ✅ Document changes

```bash
# Deployment commands
git add .
git commit -m "Phase 3: Notes workspace features

- Auto-save with visual indicators
- Tag management UI
- Enhanced editor formatting
- Better UX and productivity tools"

git push origin main
# Vercel auto-deploys on push
```

---

## Success Criteria

✅ **Phase 3 Complete when**:
- Auto-save works smoothly without lag
- Tags can be managed intuitively
- Editor is feature-rich and responsive
- No 404 or API errors
- Production deployment successful
- Users can efficiently manage notes

---

## Phase 4 Preview (After Phase 3)

Once notes workspace is complete:
- AI Integration Polish (streaming, templates)
- Search & Filtering improvements
- Analytics dashboard
- UI/UX enhancements

---

## Resources

**Helpful links**:
- TipTap documentation: https://tiptap.dev
- Lowlight (code highlighting): https://github.com/wooorm/lowlight
- NestJS Tags controller: `apps/api/src/tags/tags.controller.ts`
- Local notes storage: `apps/web/src/lib/localNotes.ts`

---

## Quick Start Commands

```bash
# Install new dependencies if needed
cd apps/web
npm install @tiptap/extension-code-block-lowlight lowlight

# Start development
npm run dev

# Test specific API endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://localhost:3001/api/tags
```

---

## Estimated Timeline

- **Phase 3 Start**: Now
- **Auto-Save**: 30 min
- **Tag Management**: 45 min
- **Editor Enhancement**: 30 min
- **Testing**: 20 min
- **Git Commit & Push**: 5 min
- **Vercel Deployment**: 5 min
- **Production Testing**: 10 min
- **Phase 3 Complete**: ~2.5 hours ✅

**Next Phase 4 starts after Phase 3 is live in production**

