import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/Header";
import Editor from "@/components/Editor";
import SuggestionsSidebar from "@/components/SuggestionsSidebar";
import ToneAnalysisModal from "@/components/ToneAnalysisModal";
import GoalsDialog from "@/components/GoalsDialog";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  id: string;
  type: "grammar" | "spelling" | "clarity" | "style";
  message: string;
  original: string;
  suggestion: string;
  from?: number;
  to?: number;
  // New fields for redesigned sidebar/card
  category?: "Correctness" | "Clarity" | "Engagement" | "Delivery";
  title?: string;
  severity?: "pro" | "standard";
  previewBefore?: string;
  previewDelete?: string;
  previewInsert?: string;
  previewAfter?: string;
}

const INITIAL_SUGGESTIONS: Suggestion[] = [];

const Index = () => {
  const { id } = useParams<{ id: string }>();
  const { authorizedFetch } = useAuth();
  const [content, setContent] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showToneModal, setShowToneModal] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [toneAnalysis, setToneAnalysis] = useState<any>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(!!id);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSyncedRef = useRef<string>("");
  const lastSyncedTitleRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grammarDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const analyzText = async () => {
    if (!content.trim()) {
      setSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis with relevant suggestions
    setTimeout(() => {
      const mockSuggestions: Suggestion[] = [
        {
          id: "1",
          type: "grammar",
          message: "Subject-verb agreement issue",
          original: "The team are working",
          suggestion: "The team is working",
          category: "Correctness",
          title: "Correct subject-verb agreement",
          severity: "pro",
          previewBefore: "The team ",
          previewDelete: "are",
          previewInsert: "is",
          previewAfter: " working really...",
        },
        {
          id: "2",
          type: "clarity",
          message: "Use a more concise phrase",
          original: "due to the fact that",
          suggestion: "because",
          category: "Clarity",
          title: "Change the wording",
          severity: "standard",
        },
        {
          id: "3",
          type: "style",
          message: "Use active voice for clarity",
          original: "The report was written by me",
          suggestion: "I wrote the report",
          category: "Engagement",
          title: "Improve your text",
          severity: "standard",
        },
        {
          id: "4",
          type: "clarity",
          message: "Be more specific about the timeframe",
          original: "might need more time",
          suggestion: "will need an additional 3-5 days",
          category: "Clarity",
          title: "Be specific",
          severity: "standard",
        },
      ];

      setSuggestions(mockSuggestions);
      setIsAnalyzing(false);
    }, 1500);
  };

  const analyzeTone = () => {
    setToneAnalysis({
      tone: "Professional but Apologetic",
      intent: "Request Extension",
      confidence: "92%",
      suggestions: [
        "Consider being more confident and solution-oriented",
        "Avoid excessive apologies - focus on solutions instead",
        "Provide specific dates rather than vague timeframes",
        "Lead with the solution, not the problem",
      ],
    });
    setShowToneModal(true);
  };

  const handleApplySuggestion = (id: string, replacement: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) {
      // Prefer precise apply using offsets to handle multiple identical errors
      if (typeof suggestion.from === "number" && typeof suggestion.to === "number") {
        const from = Math.max(0, Math.min(suggestion.from, content.length));
        const to = Math.max(from, Math.min(suggestion.to, content.length));
        const next = content.slice(0, from) + replacement + content.slice(to);
        setContent(next);
      } else {
        // Fallback: replace first occurrence (legacy)
        setContent(content.replace(suggestion.original, replacement));
      }
      setSuggestions(suggestions.filter((s) => s.id !== id));
      toast({
        title: "Suggestion applied",
        description: "Your text has been updated",
      });
    }
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const applySuggestionsBulk = (contentText: string, suggs: any[]) => {
    if (!Array.isArray(suggs) || suggs.length === 0) return contentText;
    // First pass: apply all with offsets, descending order to avoid shifting
    const withOffsets = suggs.filter((s) => typeof s.from === "number" && typeof s.to === "number");
    withOffsets.sort((a, b) => (b.from as number) - (a.from as number));
    let next = contentText;
    for (const s of withOffsets) {
      const expected = String(s.original || "");
      const replacement = String(s.suggestion || "");
      let from = Math.max(0, Math.min(Number(s.from), next.length));
      let to = Math.max(from, Math.min(Number(s.to), next.length));
      // Verify the target matches; if not, try to locate nearby
      const current = next.slice(from, to);
      if (expected && current !== expected) {
        const windowRadius = 200;
        const start = Math.max(0, from - windowRadius);
        const end = Math.min(next.length, to + windowRadius);
        const windowText = next.slice(start, end);
        const idx = windowText.indexOf(expected);
        if (idx >= 0) {
          from = start + idx;
          to = from + expected.length;
        } else {
          // As a last resort, skip this suggestion to avoid corrupting text
          continue;
        }
      }
      next = next.slice(0, from) + replacement + next.slice(to);
    }
    // Second pass: those without offsets, best-effort first occurrence replacement
    const withoutOffsets = suggs.filter((s) => !(typeof s.from === "number" && typeof s.to === "number"));
    for (const s of withoutOffsets) {
      if (s?.original && s?.suggestion) {
        const idx = next.indexOf(String(s.original));
        if (idx >= 0) {
          next = next.slice(0, idx) + String(s.suggestion) + next.slice(idx + String(s.original).length);
        }
      }
    }
    return next;
  };

  const handleApplyAllAi = (aiSuggs: any[]) => {
    const next = applySuggestionsBulk(content, aiSuggs);
    setContent(next);
    // Remove suggestions that have offsets applied or originals matched
    const remaining = suggestions.filter((s) => {
      const match = aiSuggs.find((a: any) => a.original === s.original && a.suggestion === s.suggestion);
      return !match;
    });
    setSuggestions(remaining);
    toast({ title: "Applied AI suggestions", description: `Inserted ${aiSuggs.length} changes` });
  };

  const score = Math.max(0, 100 - suggestions.length * 3);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoadingDoc(true);
      try {
        const res = await authorizedFetch(`/api/documents/${id}`);
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}
        if (!res.ok) throw new Error(data?.error || text || "Failed to load document");
        const doc = data?.document || {};
        const c = typeof doc.content_jsonb === "string"
          ? doc.content_jsonb
          : (doc.content_jsonb?.text ?? "");
        if (!cancelled) {
          setContent(c || "");
          setTitle(doc?.metadata?.title || "Untitled document");
          // Mark loaded content as synced baseline
          lastSyncedRef.current = c || "";
          lastSyncedTitleRef.current = doc?.metadata?.title || "Untitled document";
        }
      } catch {
        if (!cancelled) {
          setContent("");
          setTitle("Untitled document");
        }
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, authorizedFetch]);

  // Debounced grammar check on content edits
  useEffect(() => {
    if (!id) return;
    if (grammarDebounceRef.current) clearTimeout(grammarDebounceRef.current);
    grammarDebounceRef.current = setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      setIsAnalyzing(true);
      try {
        const res = await authorizedFetch("/api/grammar/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content, language: "en-US" }),
          signal: abortRef.current.signal as any,
        } as any);
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}
        if (!res.ok) {
          throw new Error(data?.error || text || "Failed to check grammar");
        }
        const suggs = Array.isArray(data?.suggestions) ? data.suggestions : [];
        // Map to UI suggestion objects
        const mapped = suggs.map((s: any, i: number) => ({
          id: String(i),
          type: s.category === "spelling" ? "spelling" : "grammar",
          message: s.message || "",
          original: s.original || "",
          suggestion: (s.replacements && s.replacements[0]) || "",
          from: typeof s.from === "number" ? s.from : undefined,
          to: typeof s.to === "number" ? s.to : undefined,
          category: "Correctness",
        }));
        setSuggestions(mapped);
      } catch (e) {
        // swallow errors in v1
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);
    return () => {
      if (grammarDebounceRef.current) clearTimeout(grammarDebounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [id, content, authorizedFetch]);

  // Debounced autosave when content changes (only for /doc/:id)
  useEffect(() => {
    if (!id) return;
    if (loadingDoc) return; // wait until initial load finishes
    if (content === lastSyncedRef.current && (title || "") === lastSyncedTitleRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await authorizedFetch(`/api/documents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, metadata: { title: title || "Untitled document" } }),
        });
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}
        if (!res.ok) {
          throw new Error(data?.error || text || "Failed to save");
        }
        lastSyncedRef.current = content;
        lastSyncedTitleRef.current = title || "Untitled document";
      } catch (e: any) {
        setSaveError(e?.message || "Failed to save");
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id, content, title, authorizedFetch, loadingDoc]);

  // Flush save on unmount/refresh (best-effort)
  useEffect(() => {
    if (!id) return;
    const flushSave = () => {
      if (content === lastSyncedRef.current && (title || "") === lastSyncedTitleRef.current) return;
      try {
        // Use fetch with keepalive to allow the request to complete during unload
        // Note: request body size must be small (<64KB) for keepalive.
        fetch(`/api/documents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, metadata: { title: title || "Untitled document" } }),
          keepalive: true,
        }).catch(() => {});
        lastSyncedRef.current = content;
        lastSyncedTitleRef.current = title || "Untitled document";
      } catch {}
    };
    const beforeUnload = () => {
      flushSave();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      flushSave();
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [id, content]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex overflow-visible pr-[420px]">
        <div className="flex-1 flex flex-col">
          <Header title={title} score={score} onOpenGoals={() => setShowGoals(true)} onTitleChange={setTitle} />
          <Editor 
            content={content} 
            onChange={setContent} 
            onAnalyze={analyzText}
            highlights={suggestions.map(s => ({
              text: s.original,
              category: s.category || (s.type === "grammar" ? "Correctness" : s.type === "clarity" ? "Clarity" : s.type === "style" ? "Engagement" : "Delivery")
            }))}
          />
        </div>
        <SuggestionsSidebar
          suggestions={suggestions}
          isAnalyzing={isAnalyzing}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
          onInsertAi={(text) => {
            setContent(prev => {
              const base = prev || "";
              const sep = base.endsWith("\n") || base.length === 0 ? "" : "\n\n";
              return base + sep + (text || "");
            });
          }}
          contextText={content}
          onAiSuggestions={(newSuggs) => {
            // Prepend AI suggestions to make them visible at the top
            setSuggestions(prev => [...newSuggs, ...prev]);
          }}
          onApplyAll={handleApplyAllAi}
        />
      </div>
      <GoalsDialog open={showGoals} onOpenChange={setShowGoals} onAnalyze={analyzeTone} />
      <ToneAnalysisModal
        open={showToneModal}
        onOpenChange={setShowToneModal}
        analysis={toneAnalysis}
      />
    </div>
  );
};

export default Index;
