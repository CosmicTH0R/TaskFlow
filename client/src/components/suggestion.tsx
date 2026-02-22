import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { CommandList } from './CommandList';
import { Editor, Range } from '@tiptap/core';
import React from 'react';
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, FileText
} from 'lucide-react';

export interface CommandItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
}

export const getSuggestionItems = ({ query }: { query: string }): CommandItemProps[] => {
  const items: CommandItemProps[] = [
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: React.createElement(Heading1, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: React.createElement(Heading2, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: React.createElement(Heading3, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bulleted list',
      icon: React.createElement(List, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering',
      icon: React.createElement(ListOrdered, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: React.createElement(Quote, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setBlockquote().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Display code',
      icon: React.createElement(Code, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run();
      },
    },
    {
      title: 'Page',
      description: 'Embed a sub-page inside this note',
      icon: React.createElement(FileText, { className: "w-4 h-4" }),
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        window.dispatchEvent(new CustomEvent('CREATE_SUB_PAGE'));
      },
    },
  ];

  return items.filter(item => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
};

export const renderItems = () => {
  let component: ReactRenderer;
  let popup: TippyInstance[];

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) return;

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },

    onUpdate(props: any) {
      component.updateProps(props);

      if (!props.clientRect) return;

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }

      return (component.ref as any)?.onKeyDown(props);
    },

    onExit() {
      if (popup && popup.length > 0) {
        popup[0].destroy();
      }
      if (component) {
        component.destroy();
      }
    },
  };
};
