import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SuggestionCard, { SuggestionType } from "./SuggestionCard";
import { Loader2 } from "lucide-react";

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
    <div className="w-80 border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Suggestions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {counts.all} {counts.all === 1 ? "issue" : "issues"} found
        </p>
      </div>

      {isAnalyzing ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analyzing your text...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
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

          <ScrollArea className="flex-1">
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
    </div>
  );
};

export default SuggestionsSidebar;
