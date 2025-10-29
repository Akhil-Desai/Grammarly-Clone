import { useState } from "react";
import Header from "@/components/Header";
import Editor from "@/components/Editor";
import SuggestionsSidebar from "@/components/SuggestionsSidebar";
import ToneAnalysisModal from "@/components/ToneAnalysisModal";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  id: string;
  type: "grammar" | "spelling" | "clarity" | "style";
  message: string;
  original: string;
  suggestion: string;
}

const DEMO_EMAIL = `Hi Sarah,

I wanted to reach out to you about the project deadline. The team are working really hard, but due to the fact that we've encountered some unexpected issues, we might need more time.

The report was written by me and I think it's pretty good, but I want to make sure everything is perfect before we submit it. Can we schedule a meeting to discuss this further?

Looking forward to hearing from you.

Best regards,
John`;

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "1",
    type: "grammar",
    message: "Subject-verb agreement issue",
    original: "The team are working",
    suggestion: "The team is working",
  },
  {
    id: "2",
    type: "clarity",
    message: "Use a more concise phrase",
    original: "due to the fact that",
    suggestion: "because",
  },
  {
    id: "3",
    type: "style",
    message: "Use active voice for clarity",
    original: "The report was written by me",
    suggestion: "I wrote the report",
  },
  {
    id: "4",
    type: "clarity",
    message: "Be more specific about the timeframe",
    original: "might need more time",
    suggestion: "will need an additional 3-5 days",
  },
];

const Index = () => {
  const [content, setContent] = useState(DEMO_EMAIL);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(INITIAL_SUGGESTIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showToneModal, setShowToneModal] = useState(false);
  const [toneAnalysis, setToneAnalysis] = useState<any>(null);
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
        },
        {
          id: "2",
          type: "clarity",
          message: "Use a more concise phrase",
          original: "due to the fact that",
          suggestion: "because",
        },
        {
          id: "3",
          type: "style",
          message: "Use active voice for clarity",
          original: "The report was written by me",
          suggestion: "I wrote the report",
        },
        {
          id: "4",
          type: "clarity",
          message: "Be more specific about the timeframe",
          original: "might need more time",
          suggestion: "will need an additional 3-5 days",
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
      setContent(content.replace(suggestion.original, replacement));
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Editor 
          content={content} 
          onChange={setContent} 
          onAnalyze={analyzText} 
          onAnalyzeTone={analyzeTone}
        />
        <SuggestionsSidebar
          suggestions={suggestions}
          isAnalyzing={isAnalyzing}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
        />
      </div>
      <ToneAnalysisModal
        open={showToneModal}
        onOpenChange={setShowToneModal}
        analysis={toneAnalysis}
      />
    </div>
  );
};

export default Index;
