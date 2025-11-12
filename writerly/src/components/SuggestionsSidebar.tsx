import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuggestionCard, { SuggestionType } from "./SuggestionCard";
import { Loader2, Lightbulb, Sparkles, Shield, FileCheck, Star, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Suggestion {
  id: string;
  type: SuggestionType;
  message: string;
  original: string;
  suggestion: string;
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
}

const SuggestionsSidebar = ({
  suggestions,
  isAnalyzing,
  onApply,
  onDismiss,
  onInsertAi,
}: SuggestionsSidebarProps) => {
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

  const mockResponse = `Subject: Request to Discuss Project Deadline\n\nHi Sarah,\n\nI hope this message finds you well. I wanted to discuss the project deadline with you. The team is working really hard; however, we've encountered some unexpected issues, and we may need additional time.\n\nI have written the report, and I believe it’s in good shape. However, I want to ensure everything is perfect before we submit it. Could we schedule a meeting to discuss this further?\n\nI look forward to hearing from you.\n\nBest regards,\nJohn`;

  const triggerAi = (prompt?: string) => {
    if (prompt) setAiPrompt(prompt);
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiResponse(mockResponse);
      setIsGeneratingAi(false);
    }, 800);
  };

  const onPromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!aiPrompt.trim()) return;
      triggerAi();
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
            Check for AI text & plagiarism
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
              {aiResponse && (
                <div className="border rounded-md m-2">
                  <div className="p-4 whitespace-pre-wrap text-foreground/90 text-sm leading-6">
                    {aiResponse}
                  </div>
                  <div className="flex items-center gap-3 border-t p-3">
                    <Button size="sm" onClick={() => { onInsertAi?.(aiResponse); }}>
                      Insert
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsGeneratingAi(true); setTimeout(()=>{ setAiResponse(mockResponse); setIsGeneratingAi(false); }, 600); }}>Retry</Button>
                    <Button size="icon" variant="ghost" className="ml-auto"><MoreHorizontal className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost"><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}

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
            <h2 className="font-semibold text-lg">Check for AI text & plagiarism</h2>
            <p className="text-sm text-muted-foreground mt-1">Scan your text for originality and AI-likeness</p>
          </div>

          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-medium">Ready to scan</h3>
                    <p className="text-sm text-muted-foreground">
                      Check your text against billions of web pages
                    </p>
                  </div>
                </div>
                <Button className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Run Plagiarism Check
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">What we check</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>16+ billion web pages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Academic databases and journals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Published works and books</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Previously submitted papers</span>
                  </li>
                </ul>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h3 className="text-sm font-medium">Recent Scans</h3>
                <p className="text-xs text-muted-foreground">No recent plagiarism checks</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      {/* bottom CTA moved inside scroll area to avoid stealing viewport height */}
    </div>
  );
};

export default SuggestionsSidebar;
