"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Quote } from 'lucide-react';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 mb-4 bg-surface border border-surface-border rounded-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-primary text-white' : 'hover:bg-surface-hover text-white/70 hover:text-white'}`}
      >
        <Bold size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-primary text-white' : 'hover:bg-surface-hover text-white/70 hover:text-white'}`}
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-surface-border my-auto mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'hover:bg-surface-hover text-white/70 hover:text-white'}`}
      >
        <Heading2 size={18} />
      </button>
      <div className="w-px h-6 bg-surface-border my-auto mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'hover:bg-surface-hover text-white/70 hover:text-white'}`}
      >
        <List size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-primary text-white' : 'hover:bg-surface-hover text-white/70 hover:text-white'}`}
      >
        <ListOrdered size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-primary text-white' : 'hover:bg-surface-hover text-white/70 hover:text-white'}`}
      >
        <Quote size={18} />
      </button>
    </div>
  );
};

export default function TipTapEditor({ content, onChange }: { content?: string, onChange?: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:leading-relaxed prose-pre:bg-surface-hover prose-pre:border prose-pre:border-surface-border max-w-none focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col h-full w-full">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto px-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
