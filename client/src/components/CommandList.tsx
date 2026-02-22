import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CommandItemProps } from './suggestion';

interface CommandListProps {
  items: CommandItemProps[];
  command: (item: CommandItemProps) => void;
}

export const CommandList = forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1.5 w-72 max-h-[330px] overflow-y-auto">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={index}
            className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors text-left ${
              index === selectedIndex ? 'bg-primary/20 text-foreground' : 'hover:bg-white/5 text-foreground/80'
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-background border border-white/5 flex-shrink-0 text-muted-foreground">
              {item.icon}
            </div>
            <div>
              <div className="font-medium text-foreground">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
            </div>
          </button>
        ))
      ) : (
        <div className="p-4 text-sm text-center text-muted-foreground">No matches</div>
      )}
    </div>
  );
});

CommandList.displayName = 'CommandList';
