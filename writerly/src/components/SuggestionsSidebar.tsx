import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuggestionCard, { SuggestionType } from "./SuggestionCard";
import { Loader2, Lightbulb, Sparkles, Shield, Star, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Suggestion {
  id: string;
  type: SuggestionType;
  message: string;
  original: string;
  suggestion: string;
  source?: "ai";
  from?: number;
  to?: number;
  category?: "Correctness" | "Clarity" | "Engagement" | "Delivery";
  title?: string;
  severity?: "pro" | "standard";
  previewBefore?: string;
  previewDelete?: string;
  previewInsert?: string;
  previewAfter?: string;
}

interface SuggestionsSidebarProps {
  suggestions: Suggestion[];
  isAnalyzing: boolean;
  onApply: (id: string, replacement: string) => void;
  onDismiss: (id: string) => void;
  onInsertAi?: (text: string) => void;
  contextText?: string;
  onAiSuggestions?: (suggs: Suggestion[]) => void;
  onApplyAll?: (suggs: Suggestion[]) => void;
}

const SuggestionsSidebar = ({
  suggestions,
  isAnalyzing,
  onApply,
  onDismiss,
  onInsertAi,
  contextText,
  onAiSuggestions,
  onApplyAll,
}: SuggestionsSidebarProps) => {
  const { authorizedFetch } = useAuth();
  const categories = ["All", "Correctness", "Clarity", "Engagement", "Delivery"] as const;

  const [activeTab, setActiveTab] = useState("suggestions");
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");

  const toCategory = (s: Suggestion): string =>
    s.category ?? (s.type === "grammar" ? "Correctness" : s.type === "clarity" ? "Clarity" : s.type === "style" ? "Engagement" : "Delivery");

  const countByCategory = (cat: (typeof categories)[number]) =>
    cat === "All" ? suggestions.length : suggestions.filter((s) => toCategory(s) === cat).length;

  const filtered = activeCategory === "All" ? suggestions : suggestions.filter((s) => toCategory(s) === activeCategory);

  const proList = filtered.filter((s) => s.severity === "pro");
  const standardList = filtered.filter((s) => s.severity !== "pro");

  // Only one expanded at a time
  const [openId, setOpenId] = useState<string | null>(null);
  const toggleOpen = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  // AI writing mock state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiBlockSuggestions, setAiBlockSuggestions] = useState<Suggestion[] | null>(null);
  const [showPresets, setShowPresets] = useState(true);

  const mockResponse = `Subject: Request to Discuss Project Deadline\n\nHi Sarah,\n\nI hope this message finds you well. I wanted to discuss the project deadline with you. The team is working really hard; however, we've encountered some unexpected issues, and we may need additional time.\n\nI have written the report, and I believe it’s in good shape. However, I want to ensure everything is perfect before we submit it. Could we schedule a meeting to discuss this further?\n\nI look forward to hearing from you.\n\nBest regards,\nJohn`;

  const triggerAi = async (prompt?: string) => {
    const p = (prompt ?? aiPrompt).trim();
    if (!p) return;
    if (showPresets) setShowPresets(false);
    setIsGeneratingAi(true);
    try {
      const shouldCompose = !contextText || (contextText.trim().length < 20);
      const body =
        shouldCompose
          ? { instruction: p, task: "rewrite", context: "" }
          : { instruction: p, task: "suggestions", context: contextText || "" };
      const res = await authorizedFetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) {
        throw new Error(data?.error || text || "AI generation failed");
      }
      if (!shouldCompose && Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
        const mapped = data.suggestions.map((s: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          type: "clarity",
          source: "ai",
          message: s?.message || "",
          original: s?.original || "",
          suggestion: s?.suggestion || "",
          from: typeof s?.from === "number" ? s.from : undefined,
          to: typeof s?.to === "number" ? s.to : undefined,
          // Do not assign normal categories; keep uncategorized
          severity: "standard",
        }));
        setAiBlockSuggestions(mapped);
        onAiSuggestions?.(mapped); // still update global list if parent wants it
        // Keep user in AI tab to review the block
        setActiveTab("ai-writing");
        // Hide raw JSON/text view when suggestions are present
        setAiResponse(null);
        return;
      }
      // Also show any improved text for optional insert
      const looksJson =
        typeof data?.text === "string" &&
        /^\s*[{[]/.test(data.text) &&
        /"suggestions"\s*:/.test(data.text);
      const candidateText = typeof data?.text === "string" ? data.text : null;
      setAiBlockSuggestions(null);
      setAiResponse(!looksJson ? candidateText : null);
    } catch {
      // fallback to mock in v1
      setAiBlockSuggestions(null);
      setAiResponse(mockResponse);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const onPromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!aiPrompt.trim()) return;
      const current = aiPrompt;
      setAiPrompt("");
      if (showPresets) setShowPresets(false);
      triggerAi(current);
    }
  };

  return (
    <div className="w-[420px] fixed right-0 top-0 bottom-0 border-l border-border bg-card flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0 sticky top-0 z-10">
          <TabsTrigger 
            value="suggestions" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 !whitespace-normal text-left leading-snug break-words px-3"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Review suggestions
          </TabsTrigger>
          <TabsTrigger 
            value="ai-writing" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 !whitespace-normal text-left leading-snug break-words px-3"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Write with generative AI
          </TabsTrigger>
          <TabsTrigger 
            value="plagiarism" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 !whitespace-normal text-left leading-snug break-words px-3"
          >
            <Shield className="w-4 h-4 mr-2" />
            Voice settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="flex-1 flex flex-col mt-0 overflow-hidden min-h-0">

          {isAnalyzing ? (
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Analyzing your text...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-4">
                <h2 className="text-xl font-semibold">Review suggestions <span className="text-foreground/70 font-normal">{suggestions.length}</span></h2>
                {/* Category bars row */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="px-1 py-1 text-xs">
                    <div>Correctness</div>
                    <div className="mt-1 h-0.5 w-8 bg-red-500 rounded-full" />
                  </div>
                  <div className="px-1 py-1 text-xs">
                    <div>Clarity</div>
                    <div className="mt-1 h-0.5 w-8 bg-blue-500 rounded-full" />
                  </div>
                  <div className="px-1 py-1 text-xs">
                    <div>Engagement</div>
                    <div className="mt-1 h-0.5 w-8 bg-emerald-600 rounded-full" />
                  </div>
                  <div className="px-1 py-1 text-xs">
                    <div>Delivery</div>
                    <div className="mt-1 h-0.5 w-8 bg-purple-500 rounded-full" />
                  </div>
                </div>
                {proList.length > 0 && (
                  <div className="px-1 py-2 text-sm text-foreground flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">Pro suggestions</span>
                    <span className="ml-1 text-muted-foreground">{proList.length}</span>
                  </div>
                )}
                {proList.map((suggestion) => (
                  <SuggestionCard
                    key={`pro-${suggestion.id}`}
                    suggestion={suggestion}
                    expanded={openId === suggestion.id}
                    onToggle={toggleOpen}
                    onApply={onApply}
                    onDismiss={onDismiss}
                  />
                ))}
                {standardList.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    expanded={openId === suggestion.id}
                    onToggle={toggleOpen}
                    onApply={onApply}
                    onDismiss={onDismiss}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No suggestions for this category.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="ai-writing" className="flex-1 flex flex-col mt-0 overflow-hidden min-h-0">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-lg">What do you want to do?</h2>
            <p className="text-sm text-muted-foreground mt-1">Here are some ideas</p>
          </div>

          <ScrollArea className="flex-1 h-full">
            <div className="p-2 space-y-3">
              {isGeneratingAi && (
                <div className="p-4 text-sm text-muted-foreground">Generating…</div>
              )}
              {aiBlockSuggestions && aiBlockSuggestions.length > 0 && (
                <div className="border rounded-md m-2">
                  <div className="p-4 text-foreground/90 text-sm leading-6 space-y-3">
                    <div className="font-medium">AI Suggestions ({aiBlockSuggestions.length})</div>
                    <ol className="list-decimal pl-5 space-y-2">
                      {aiBlockSuggestions.map((s) => (
                        <li key={s.id} className="space-y-1">
                          <div className="text-foreground">{s.message}</div>
                          <div className="text-xs">
                            <span className="line-through text-muted-foreground mr-1">{s.original}</span>
                            <span className="font-semibold">{s.suggestion}</span>
                            {typeof s.from === "number" && typeof s.to === "number" && (
                              <span className="text-muted-foreground ml-2">[{s.from}-{s.to}]</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex items-center gap-3 border-t p-3">
                    <Button size="sm" onClick={() => {
                      if (aiBlockSuggestions) {
                        onApplyAll?.(aiBlockSuggestions);
                        setAiBlockSuggestions(null);
                        setAiResponse(null);
                      }
                    }}>
                      Insert all
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAiBlockSuggestions(null)}>Clear</Button>
                  </div>
                </div>
              )}
              {aiResponse && (
                <div className="border rounded-md m-2">
                  <div className="p-4 whitespace-pre-wrap text-foreground/90 text-sm leading-6">
                    {aiResponse}
                  </div>
                  <div className="flex items-center gap-3 border-t p-3">
                    <Button size="sm" onClick={() => {
                      onInsertAi?.(aiResponse);
                      setAiResponse(null);
                      setAiPrompt("");
                    }}>
                      Insert
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsGeneratingAi(true); setTimeout(()=>{ setAiResponse(mockResponse); setIsGeneratingAi(false); }, 600); }}>Retry</Button>
                    <Button size="icon" variant="ghost" className="ml-auto"><MoreHorizontal className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost"><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}

              {showPresets && (
                <>
              <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-muted/50 rounded-md" onClick={() => triggerAi("Improve it") }>
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-left">Improve it</span>
              </button>
              <div className="border-t" />
              <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-muted/50 rounded-md" onClick={() => triggerAi("Identify any gaps") }>
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-left">Identify any gaps</span>
              </button>
              <div className="border-t" />
              <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-muted/50 rounded-md" onClick={() => triggerAi("More ideas") }>
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-left">More ideas</span>
              </button>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <Input 
              placeholder="Tell us to..." 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={onPromptKeyDown}
            />
          </div>
        </TabsContent>

        <TabsContent value="plagiarism" className="flex-1 flex flex-col mt-0 overflow-hidden min-h-0">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-lg">Voice settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Control tone, formality, audience, intent, and domain for rewrites</p>
          </div>
          <VoiceSettingsPanel />
        </TabsContent>
      </Tabs>
      {/* bottom CTA moved inside scroll area to avoid stealing viewport height */}
    </div>
  );
};

export default SuggestionsSidebar;

// ---- Voice Settings Panel (uses /api/user/settings) ----
const tones = ["formal","neutral","friendly","confident","persuasive","empathetic"] as const;
const audiences = ["general","expert","executive","peer","customer"] as const;
const intents = ["inform","explain","persuade","request","apologize","congratulate"] as const;
const domains = ["general","academic","business","technical","creative","legal","medical"] as const;

function VoiceSettingsPanel() {
  const { authorizedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [voice, setVoice] = useState({
    tone: "neutral",
    formality: 3,
    audience: "general",
    intent: "inform",
    domain: "general",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setSavedMsg(null);
        const res = await authorizedFetch("/api/user/settings", { method: "GET" });
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}
        if (!res.ok) throw new Error(data?.error || text || "Failed to load settings");
        const v = data?.settings?.voice || {};
        if (mounted) {
          setVoice({
            tone: tones.includes(v.tone) ? v.tone : "neutral",
            formality: Number.isFinite(v.formality) ? Math.max(1, Math.min(5, Math.round(v.formality))) : 3,
            audience: audiences.includes(v.audience) ? v.audience : "general",
            intent: intents.includes(v.intent) ? v.intent : "inform",
            domain: domains.includes(v.domain) ? v.domain : "general",
          });
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load settings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [authorizedFetch]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const res = await authorizedFetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice }),
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch {}
      if (!res.ok) throw new Error(data?.error || text || "Failed to save settings");
      setSavedMsg("Saved");
    } catch (e: any) {
      setError(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 1500);
    }
  };

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">Loading voice settings…</div>
        ) : (
          <>
            {error && <div className="p-2 text-sm text-red-600 border border-red-600/30 rounded">{error}</div>}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={voice.tone} onValueChange={(v) => setVoice({ ...voice, tone: v as typeof tones[number] })}>
                  <SelectTrigger id="tone" className="capitalize"><SelectValue placeholder="Select tone" /></SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (<SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formality">Formality (1 informal – 5 very formal)</Label>
                <div className="px-1">
                  <Slider
                    id="formality"
                    min={1}
                    max={5}
                    step={1}
                    value={[voice.formality]}
                    onValueChange={(v) => setVoice({ ...voice, formality: v?.[0] ?? 3 })}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Current: {voice.formality}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Select value={voice.audience} onValueChange={(v) => setVoice({ ...voice, audience: v as typeof audiences[number] })}>
                  <SelectTrigger id="audience" className="capitalize"><SelectValue placeholder="Select audience" /></SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => (<SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intent">Intent</Label>
                <Select value={voice.intent} onValueChange={(v) => setVoice({ ...voice, intent: v as typeof intents[number] })}>
                  <SelectTrigger id="intent" className="capitalize"><SelectValue placeholder="Select intent" /></SelectTrigger>
                  <SelectContent>
                    {intents.map((i) => (<SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select value={voice.domain} onValueChange={(v) => setVoice({ ...voice, domain: v as typeof domains[number] })}>
                  <SelectTrigger id="domain" className="capitalize"><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (<SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              {savedMsg && <div className="text-xs text-emerald-600">{savedMsg}</div>}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
