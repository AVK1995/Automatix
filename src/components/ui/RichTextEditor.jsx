'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Heading1, 
  Heading2,
  X,
  Check,
  Trash2,
  ExternalLink
} from 'lucide-react';
import ColorPicker from '@/components/ui/ColorPicker';

// Custom Themed Link Modal (Replaces browser default prompt)
function LinkInsertModal({ isOpen, onClose, initialUrl, onSave, onRemove }) {
  const [url, setUrl] = useState(initialUrl || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      onRemove();
    } else {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('mailto:')) {
        finalUrl = 'https://' + finalUrl;
      }
      onSave(finalUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
      <div 
        className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <LinkIcon size={16} className="text-accent-blue" />
            <h4 className="text-sm font-bold text-white">Insert / Edit Link</h4>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary">Destination URL</label>
            <input
              type="text"
              autoFocus
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com or mailto:info@example.com"
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
            {initialUrl ? (
              <button
                type="button"
                onClick={() => { onRemove(); onClose(); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                Remove
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-accent-blue hover:bg-accent-blue/90 text-white flex items-center gap-1.5 shadow-md shadow-accent-blue/20 transition-all cursor-pointer"
              >
                <Check size={14} />
                Save Link
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const MenuBar = ({ editor }) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');

  if (!editor) {
    return null;
  }

  const handleOpenLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setCurrentLinkUrl(previousUrl);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = (url) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white/5 border-b border-white/10 rounded-t-md relative z-20">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('bold') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('italic') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('underline') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        
        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors font-bold text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Heading 2"
        >
          H2
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('bulletList') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${editor.isActive('orderedList') ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={handleOpenLinkModal}
          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${editor.isActive('link') ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary'}`}
          title="Insert / Edit Hyperlink"
        >
          <LinkIcon size={16} />
        </button>

        {/* Modern Text Color Selector with High z-index Popover */}
        <div className="relative z-30">
          <ColorPicker
            value={editor.getAttributes('textStyle').color || '#ffffff'}
            onChange={(col) => editor.chain().focus().setColor(col).run()}
            allowGradients={false}
            customTrigger={(currentColor) => (
              <button
                type="button"
                className="flex flex-col items-center justify-center p-1.5 rounded-md hover:bg-white/10 transition-colors relative group cursor-pointer"
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
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-text-secondary disabled:opacity-30 cursor-pointer"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-text-secondary disabled:opacity-30 cursor-pointer"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <LinkInsertModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        initialUrl={currentLinkUrl}
        onSave={handleSaveLink}
        onRemove={handleRemoveLink}
      />
    </>
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
          target: '_blank',
          rel: 'noopener noreferrer'
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
    <div className="border border-white/10 rounded-md bg-black/30 relative">
      <MenuBar editor={editor} />
      <div className="overflow-hidden rounded-b-md">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
