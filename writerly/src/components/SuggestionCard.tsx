import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, MoreHorizontal, Star } from "lucide-react";

export type SuggestionType = "grammar" | "spelling" | "clarity" | "style";

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

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: (id: string, replacement: string) => void;
  onDismiss: (id: string) => void;
  expanded?: boolean;
  onToggle?: (id: string) => void;
}

const SuggestionCard = ({ suggestion, onApply, onDismiss, expanded = false, onToggle }: SuggestionCardProps) => {
  const headingLeft = suggestion.category ?? suggestion.type;
  const title = suggestion.title ?? suggestion.message;

  const hasPreviewParts =
    suggestion.previewBefore !== undefined ||
    suggestion.previewDelete !== undefined ||
    suggestion.previewInsert !== undefined ||
    suggestion.previewAfter !== undefined;

  return (
    <Card className="transition-all hover:shadow-md border-0 border-b">
      <CardContent className="p-4">
        {/* Header row clickable to expand/collapse */}
        <button
          type="button"
          className="w-full text-left flex items-start justify-between"
          onClick={() => onToggle?.(suggestion.id)}
        >
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{headingLeft}</span>
            <span> · </span>
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {suggestion.severity === "pro" && <Star className="w-4 h-4 fill-current" />}
            <Info className="w-4 h-4" />
          </div>
        </button>

        {/* Collapsed preview */}
        {!expanded && (
          <p className="text-foreground mt-2 line-clamp-1">
            {hasPreviewParts ? (
              <>
                {suggestion.previewBefore}
                {suggestion.previewDelete && (
                  <span className="line-through text-muted-foreground">{suggestion.previewDelete} </span>
                )}
                {suggestion.previewInsert && (
                  <span className="font-semibold">{suggestion.previewInsert}</span>
                )}
                {suggestion.previewAfter}
              </>
            ) : (
              suggestion.message
            )}
          </p>
        )}

        {/* Expanded body */}
        {expanded && (
          <div className="space-y-3 mt-3">
            <div className="text-base">
              {hasPreviewParts ? (
                <p className="text-foreground">
                  {suggestion.previewBefore}
                  {suggestion.previewDelete && (
                    <span className="line-through text-muted-foreground">{suggestion.previewDelete} </span>
                  )}
                  {suggestion.previewInsert && (
                    <span className="font-semibold">{suggestion.previewInsert}</span>
                  )}
                  {suggestion.previewAfter}
                </p>
              ) : (
                <p className="text-foreground">
                  {suggestion.original ? (
                    <>
                      <span className="line-through text-muted-foreground mr-1">{suggestion.original}</span>
                      <span className="font-semibold">{suggestion.suggestion}</span>
                    </>
                  ) : (
                    suggestion.message
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => onApply(suggestion.id, suggestion.suggestion)}
              >
                Accept
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDismiss(suggestion.id)}>
                Dismiss
              </Button>
              <Button size="icon" variant="ghost" className="ml-auto">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestionCard;
