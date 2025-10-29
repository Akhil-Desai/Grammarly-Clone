import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuggestionCard, { SuggestionType } from "./SuggestionCard";
import { Loader2, Lightbulb, Sparkles, Shield, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Suggestion {
  id: string;
  type: SuggestionType;
  message: string;
  original: string;
  suggestion: string;
}

interface SuggestionsSidebarProps {
  suggestions: Suggestion[];
  isAnalyzing: boolean;
  onApply: (id: string, replacement: string) => void;
  onDismiss: (id: string) => void;
}

const SuggestionsSidebar = ({
  suggestions,
  isAnalyzing,
  onApply,
  onDismiss,
}: SuggestionsSidebarProps) => {
  const filterByType = (type?: SuggestionType) =>
    type ? suggestions.filter((s) => s.type === type) : suggestions;

  const counts = {
    all: suggestions.length,
    grammar: filterByType("grammar").length,
    spelling: filterByType("spelling").length,
    clarity: filterByType("clarity").length,
    style: filterByType("style").length,
  };

  return (
    <div className="w-96 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="suggestions" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
          <TabsTrigger 
            value="suggestions" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger 
            value="ai-writing" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Writing
          </TabsTrigger>
          <TabsTrigger 
            value="plagiarism" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            <Shield className="w-4 h-4 mr-2" />
            Plagiarism
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-lg">Suggestions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {counts.all} {counts.all === 1 ? "issue" : "issues"} found
            </p>
          </div>

          {isAnalyzing ? (
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Analyzing your text...</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-4 mt-4 flex-shrink-0">
                <TabsTrigger value="all" className="text-xs">
                  All ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="grammar" className="text-xs">
                  Grammar ({counts.grammar})
                </TabsTrigger>
                <TabsTrigger value="clarity" className="text-xs">
                  Clarity ({counts.clarity})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  <TabsContent value="all" className="mt-0 space-y-3">
                    {suggestions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No suggestions yet. Start writing!
                        </p>
                      </div>
                    ) : (
                      suggestions.map((suggestion) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onApply={onApply}
                          onDismiss={onDismiss}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="grammar" className="mt-0 space-y-3">
                    {filterByType("grammar").map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onApply={onApply}
                        onDismiss={onDismiss}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="clarity" className="mt-0 space-y-3">
                    {filterByType("clarity").map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onApply={onApply}
                        onDismiss={onDismiss}
                      />
                    ))}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="ai-writing" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-lg">Write with AI</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Generate ideas and content with AI assistance
            </p>
          </div>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What would you like to write about?</label>
                <Textarea 
                  placeholder="E.g., 'Write a professional email requesting a deadline extension' or 'Suggest 3 ways to improve this paragraph'"
                  className="min-h-[100px]"
                />
                <Button className="w-full" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-medium">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Make it more professional
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Make it more concise
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Expand this section
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Change tone to friendly
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="plagiarism" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-lg">Plagiarism Check</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scan your text for originality
            </p>
          </div>

          <ScrollArea className="flex-1 overflow-auto">
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
    </div>
  );
};

export default SuggestionsSidebar;
