import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button } from './ui/button';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Quote, ImageIcon, Link as LinkIcon 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Write something..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL of the image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    
    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-input bg-background rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 border-b border-border bg-muted/40">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
          style={{ backgroundColor: editor.isActive('bold') ? 'var(--accent)' : 'transparent' }}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
          style={{ backgroundColor: editor.isActive('italic') ? 'var(--accent)' : 'transparent' }}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-active={editor.isActive('strike')}
          style={{ backgroundColor: editor.isActive('strike') ? 'var(--accent)' : 'transparent' }}
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-active={editor.isActive('code')}
          style={{ backgroundColor: editor.isActive('code') ? 'var(--accent)' : 'transparent' }}
        >
          <Code className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
          style={{ backgroundColor: editor.isActive('bulletList') ? 'var(--accent)' : 'transparent' }}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
          style={{ backgroundColor: editor.isActive('orderedList') ? 'var(--accent)' : 'transparent' }}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive('blockquote')}
          style={{ backgroundColor: editor.isActive('blockquote') ? 'var(--accent)' : 'transparent' }}
        >
          <Quote className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={setLink}
          data-active={editor.isActive('link')}
          style={{ backgroundColor: editor.isActive('link') ? 'var(--accent)' : 'transparent' }}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-sm"
          onClick={addImage}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Context */}
      <div className="bg-card text-foreground cursor-text max-h-[60vh] overflow-y-auto" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
