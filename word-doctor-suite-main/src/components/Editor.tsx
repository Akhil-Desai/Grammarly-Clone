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
    const text = (e.currentTarget as HTMLDivElement).textContent || "";
    onChange(text);
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

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <div className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-3xl p-8">
          <div
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
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
