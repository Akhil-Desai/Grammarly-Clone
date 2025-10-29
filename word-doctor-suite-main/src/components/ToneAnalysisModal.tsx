import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ToneAnalysis {
  tone: string;
  intent: string;
  confidence: string;
  suggestions: string[];
}

interface ToneAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ToneAnalysis | null;
}

const ToneAnalysisModal = ({ open, onOpenChange, analysis }: ToneAnalysisModalProps) => {
  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tone & Intent Analysis</DialogTitle>
          <DialogDescription>
            AI-powered analysis of your writing's tone and intent
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Detected Tone</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-1.5">
                {analysis.tone}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {analysis.confidence} confidence
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Primary Intent</h4>
            <Badge variant="outline" className="text-lg px-4 py-1.5">
              {analysis.intent}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recommendations</h4>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToneAnalysisModal;
