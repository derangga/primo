import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "~/components/icon";
import { typeaheadMatch, type PickerEntry } from "~/picker-entries";
import { cn } from "~/lib/utils";

// How long a pause ends a word being typed.
const typeaheadPauseMs = 700;

// The list inside every picker: a popover from 640 px and, below that, a bottom sheet around this
// same component. It is the scroll container, so a caller gives it a maximum height. It opens
// scrolled to the selected option, takes focus, and follows the listbox pattern: arrows, Home, End,
// Enter, and typing to jump to a match.
export function OptionList<V extends string>(props: {
  readonly entries: ReadonlyArray<PickerEntry<V>>;
  readonly value: V | undefined;
  readonly label: string;
  readonly onSelect: (value: V) => void;
  readonly className?: string;
}) {
  const { entries, value, label, onSelect, className } = props;
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const options = entries.flatMap((entry, index) =>
    entry.kind === "option" ? [{ entry, index }] : [],
  );

  const selectedAt = options.findIndex((option) => option.entry.value === value);
  const [activeAt, setActiveAt] = useState(() => Math.max(selectedAt, 0));

  const optionId = (position: number) => `${listId}-${position}`;

  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>("[aria-selected=true]");

    list?.focus({ preventScroll: true });

    if (list !== null && list !== undefined && selected !== null && selected !== undefined) {
      list.scrollTop = selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2;
    }
  }, []);

  const moveTo = (position: number) => {
    const next = Math.min(Math.max(position, 0), options.length - 1);

    setActiveAt(next);
    document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const now = Date.now();
    const typing = typed.current.text !== "" && now - typed.current.at < typeaheadPauseMs;

    // A space in the middle of a word ("jawa t") is part of the word; on its own it selects.
    const typesCharacter =
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      (event.key !== " " || typing);

    if (typesCharacter) {
      typed.current = { text: (typing ? typed.current.text : "") + event.key, at: now };

      const match = typeaheadMatch(
        options.map((option) => option.entry.label),
        typed.current.text,
        activeAt,
      );

      if (match !== -1) {
        moveTo(match);
      }

      event.preventDefault();

      return;
    }

    switch (event.key) {
      case "ArrowDown":
        moveTo(activeAt + 1);
        break;

      case "ArrowUp":
        moveTo(activeAt - 1);
        break;

      case "Home":
        moveTo(0);
        break;

      case "End":
        moveTo(options.length - 1);
        break;

      case "Enter":
      case " ": {
        const active = options[activeAt]?.entry;

        if (active !== undefined) {
          onSelect(active.value);
        }

        break;
      }

      default:
        return;
    }

    event.preventDefault();
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      aria-activedescendant={optionId(activeAt)}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn("relative overflow-y-auto overscroll-contain outline-none", className)}
    >
      {entries.map((entry, index) => {
        switch (entry.kind) {
          case "divider":
            return (
              <hr
                key={`divider-${index}`}
                className="mx-2.5 my-1 h-px border-0 bg-border max-sm:mx-0"
              />
            );

          case "option": {
            const position = options.findIndex((option) => option.index === index);
            const selected = entry.value === value;

            return (
              <div
                key={entry.value}
                id={optionId(position)}
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(entry.value)}
                onPointerMove={(event) => {
                  if (event.pointerType === "mouse" && position !== activeAt) {
                    setActiveAt(position);
                  }
                }}
                className={cn(
                  "flex min-h-8 max-sm:min-h-11 max-sm:pr-3 cursor-default items-center justify-between gap-3 rounded-[6px] px-2.5 whitespace-nowrap select-none",
                  entry.indent === true && "pl-[26px]",
                  entry.emphasis === true && "font-medium",
                  position === activeAt && "bg-hover",
                  selected && "bg-accent-soft font-medium text-accent",
                )}
              >
                <span>{entry.label}</span>
                {selected ? <Icon name="check" /> : null}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
