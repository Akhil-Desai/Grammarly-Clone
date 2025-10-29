import { CheckCircle2, AlertCircle, Info, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type SuggestionType = "grammar" | "spelling" | "clarity" | "style";

interface Suggestion {
  id: string;
  type: SuggestionType;
  message: string;
  original: string;
  suggestion: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: (id: string, replacement: string) => void;
  onDismiss: (id: string) => void;
}

const typeConfig = {
  grammar: {
    icon: AlertCircle,
    label: "Grammar",
    variant: "destructive" as const,
  },
  spelling: {
    icon: CheckCircle2,
    label: "Spelling",
    variant: "destructive" as const,
  },
  clarity: {
    icon: Info,
    label: "Clarity",
    variant: "default" as const,
  },
  style: {
    icon: Lightbulb,
    label: "Style",
    variant: "secondary" as const,
  },
};

const SuggestionCard = ({ suggestion, onApply, onDismiss }: SuggestionCardProps) => {
  const config = typeConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Icon className="w-4 h-4 mt-1 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={config.variant} className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-foreground mb-3">{suggestion.message}</p>
            
            {suggestion.original && (
              <div className="space-y-2">
                <div className="p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                  <p className="text-sm line-through text-muted-foreground">
                    {suggestion.original}
                  </p>
                </div>
                <div className="p-2 bg-success/10 rounded border-l-2 border-success">
                  <p className="text-sm text-foreground font-medium">
                    {suggestion.suggestion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onApply(suggestion.id, suggestion.suggestion)}
            className="flex-1"
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(suggestion.id)}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestionCard;
