// switched to a contenteditable editor for inline highlight mock
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronUp } from "lucide-react";

interface Highlight {
  text: string;
  category: "Correctness" | "Clarity" | "Engagement" | "Delivery";
}

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onAnalyze: () => void;
  highlights?: Highlight[];
}

const Editor = ({ content, onChange, onAnalyze, highlights = [] }: EditorProps) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Use innerText so <br> and block boundaries become newline characters.
    const text = (e.currentTarget as HTMLDivElement).innerText || "";
    onChange(text);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plain = e.clipboardData?.getData("text/plain") || "";
    const normalized = plain.replace(/\r\n?/g, "\n");
    // If editor is empty, set content directly so line breaks render correctly
    const isEmpty = (editorRef.current?.textContent || "").length === 0;
    if (isEmpty) {
      onChange(normalized);
      return;
    }
    // Insert as plain text at the caret
    document.execCommand("insertText", false, normalized);
    // Sync state after DOM updates
    setTimeout(() => {
      const next = editorRef.current?.textContent || "";
      onChange(next);
    }, 0);
  };

  const applyFormat = (command: "bold" | "italic" | "underline") => {
    editorRef.current?.focus();
    document.execCommand(command);
  };

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const toClass = (category: Highlight["category"]) =>
    category === "Correctness"
      ? "underline-correctness"
      : category === "Clarity"
      ? "underline-clarity"
      : category === "Engagement"
      ? "underline-engagement"
      : "underline-delivery";

  const renderHtml = () => {
    let html = escapeHtml(content);
    // Sort by length to reduce overlapping wrap chances
    const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);
    sorted.forEach(({ text, category }) => {
      if (!text) return;
      const re = new RegExp(`(${escapeRegExp(text)})`, "g");
      html = html.replace(re, `<span class=\"${toClass(category)}\">$1</span>`);
    });
    // Convert newlines to <br>
    html = html.replace(/\n/g, "<br>");
    return { __html: html } as { __html: string };
  };

  const words = React.useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);
  const chars = content.length;
  const readingSeconds = Math.max(1, Math.round((words / 200) * 60));
  const speakingSeconds = Math.max(1, Math.round((words / 130) * 60));
  const readability = 80; // mock value

  // Keep caret at end only when highlights update (avoid forcing during typing)
  React.useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    // Only adjust caret if the editor currently has focus; otherwise this can steal focus
    if (document.activeElement !== el) return;
    const selection = window.getSelection?.();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false); // move caret to end
    selection.removeAllRanges();
    selection.addRange(range);
  }, [highlights]);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <div className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-3xl p-8">
          <div
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
          onPaste={handlePaste}
            className="min-h-[520px] text-lg leading-relaxed outline-none"
            ref={editorRef}
            dangerouslySetInnerHTML={renderHtml()}
            aria-label="Editor"
          />
        </div>
      </div>

      <div className="p-3 bg-background">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-4">
            <button className="font-bold" onClick={() => applyFormat("bold")}>B</button>
            <button className="italic" onClick={() => applyFormat("italic")}>I</button>
            <button className="underline" onClick={() => applyFormat("underline")}>U</button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-md shadow-sm">
                {words} words
                <ChevronUp className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
              <div className="p-3 space-y-2">
                <div className="rounded-md border px-3 py-2 font-semibold">{words} words</div>
                <div className="px-3 py-1">{chars} characters</div>
                <div className="px-3 py-1">{readingSeconds} sec reading time</div>
                <div className="px-3 py-1">{speakingSeconds} sec speaking time</div>
                <div className="px-3 py-1">{readability} readability score</div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Editor;
