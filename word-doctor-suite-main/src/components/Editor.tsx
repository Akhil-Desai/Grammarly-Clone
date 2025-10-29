import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onAnalyze: () => void;
  onAnalyzeTone: () => void;
}

const Editor = ({ content, onChange, onAnalyze, onAnalyzeTone }: EditorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-8">
        <Textarea
          value={content}
          onChange={handleChange}
          onBlur={onAnalyze}
          placeholder="Start writing or paste your text here..."
          className="min-h-[600px] text-lg leading-relaxed resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
        />
      </div>
      
      <div className="border-t border-border p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            <span>{content.length} characters</span>
            <span>{Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)} min read</span>
          </div>
          <Button onClick={onAnalyzeTone} variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Tone & Intent
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
