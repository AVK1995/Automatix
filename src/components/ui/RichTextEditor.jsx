'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, List, ListOrdered, Undo, Redo, Heading1, Heading2 } from 'lucide-react';
import ColorPicker from '@/components/ui/ColorPicker';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    if (previousUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border-b border-white/10 rounded-t-md">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('bold') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('italic') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('underline') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        <UnderlineIcon size={16} />
      </button>
      
      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        H2
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('bulletList') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('orderedList') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={toggleLink}
        className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('link') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
      >
        <LinkIcon size={16} />
      </button>

      {/* Modern Text Color Selector with Brush/Underline indicator */}
      <div className="w-auto">
        <ColorPicker
          value={editor.getAttributes('textStyle').color || '#ffffff'}
          onChange={(col) => editor.chain().focus().setColor(col).run()}
          allowGradients={false}
          customTrigger={(currentColor) => (
            <button
              type="button"
              className="flex flex-col items-center justify-center p-1.5 rounded-md hover:bg-white/10 transition-colors relative group"
              title="Text Color"
            >
              <span className="text-xs font-black leading-none text-white font-serif">A</span>
              <span 
                className="w-3.5 h-[3px] rounded-full mt-0.5 shadow-sm"
                style={{ backgroundColor: currentColor || '#ffffff' }}
              />
            </button>
          )}
        />
      </div>

      <div className="flex-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-text-secondary disabled:opacity-30"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-text-secondary disabled:opacity-30"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent-blue hover:underline cursor-pointer',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none min-h-[150px] p-4 focus:outline-none text-white',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-white/10 rounded-md overflow-hidden bg-black/30">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
