import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronUp } from "lucide-react";

interface Highlight {
  text: string;
  category: "Correctness" | "Clarity" | "Engagement" | "Delivery";
}

interface RangeHighlight {
  from: number;
  to: number;
  category: "Correctness" | "Clarity" | "Engagement" | "Delivery";
}

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onAnalyze: () => void;
  highlights?: Highlight[];
  ranges?: RangeHighlight[];
}

const Editor = ({ content, onChange, onAnalyze, highlights = [], ranges = [] }: EditorProps) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const escapeHtml = (str: string) =>
    String(str)
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

  // Text-match based highlighting (fallback; used if no ranges provided)
  const renderHtmlByText = React.useCallback(() => {
    if (!highlights || highlights.length === 0) {
      return escapeHtml(content || "");
    }
    let html = escapeHtml(content || "");
    const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);
    sorted.forEach(({ text, category }) => {
      if (!text) return;
      const re = new RegExp(`(${escapeRegExp(text)})`, "g");
      html = html.replace(re, `<span class="${toClass(category)}">$1</span>`);
    });
    return html;
  }, [content, highlights]);

  // Offset-based highlighting (preferred)
  const renderHtmlByRanges = React.useCallback(() => {
    if (!ranges || ranges.length === 0) {
      return renderHtmlByText();
    }
    const normalized = [...ranges]
      .map(r => ({
        from: Math.max(0, Math.min(r.from, content.length)),
        to: Math.max(0, Math.min(r.to, content.length)),
        category: r.category,
      }))
      .filter(r => r.to > r.from)
      .sort((a, b) => a.from - b.from || a.to - b.to);
    const parts: Array<{ text: string; cls?: string }> = [];
    let cursor = 0;
    for (const r of normalized) {
      if (r.from > cursor) {
        parts.push({ text: content.slice(cursor, r.from) });
      }
      parts.push({ text: content.slice(r.from, r.to), cls: toClass(r.category) });
      cursor = r.to;
    }
    if (cursor < content.length) {
      parts.push({ text: content.slice(cursor) });
    }
    const html = parts
      .map(p => {
        const safe = escapeHtml(p.text);
        return p.cls ? `<span class="${p.cls}">${safe}</span>` : safe;
      })
      .join("");
    return html;
  }, [content, ranges]);

  const highlightedHtml = React.useMemo(() => {
    // Ensure there is always at least one character so the last newline renders height correctly
    const html = renderHtmlByRanges();
    return html === "" ? " " : html;
  }, [renderHtmlByRanges]);

  const onScroll = () => {
    const ta = textareaRef.current;
    const ov = overlayRef.current;
    if (!ta || !ov) return;
    ov.scrollTop = ta.scrollTop;
    ov.scrollLeft = ta.scrollLeft;
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-auto">
      <div className="flex-1 py-8 px-4">
        <div className="mx-auto max-w-3xl p-8">
          <div className="relative">
            <div
              aria-hidden="true"
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-lg leading-relaxed text-foreground"
              style={{
                padding: "0.5rem 0.75rem",
              }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onScroll={onScroll}
              className="min-h-[520px] w-full text-lg leading-relaxed outline-none whitespace-pre-wrap bg-transparent relative"
              style={{
                color: "transparent",
                caretColor: "hsl(var(--foreground))",
                padding: "0.5rem 0.75rem",
              }}
              aria-label="Editor"
            />
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      {(() => {
        const words = React.useMemo(() => String(content || "").trim().split(/\s+/).filter(Boolean).length, [content]);
        const chars = content.length;
        const readingSeconds = Math.max(1, Math.round((words / 200) * 60));
        const speakingSeconds = Math.max(1, Math.round((words / 130) * 60));
        return (
          <div className="p-3 bg-background border-t">
            <div className="flex items-center justify-center">
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
                    <div className="px-3 py-1">{chars.toLocaleString()} characters</div>
                    <div className="px-3 py-1">
                      {Math.floor(readingSeconds / 60)} min {readingSeconds % 60} sec reading time
                    </div>
                    <div className="px-3 py-1">
                      {Math.floor(speakingSeconds / 60)} min {speakingSeconds % 60} sec speaking time
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Editor;
