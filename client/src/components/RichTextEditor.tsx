import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import SlashCommands from './SlashCommands';
import { getSuggestionItems, renderItems } from './suggestion';
import { Button } from './ui/button';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Quote, ImageIcon, Link as LinkIcon 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = "Write something...", readOnly = false }: RichTextEditorProps) {
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
      SlashCommands.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        } as any, // Bypass strict typing for simplicity
      }),
    ],
    content: value,
    editable: !readOnly,
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
    <div className={`bg-transparent rounded-md overflow-hidden ${readOnly ? '' : 'focus-within:ring-0'}`}>
      {/* Editor Context */}
      <div className={`bg-transparent text-foreground ${!readOnly ? 'cursor-text' : 'cursor-default'}`} onClick={() => { if (!readOnly) editor.chain().focus().run(); }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
