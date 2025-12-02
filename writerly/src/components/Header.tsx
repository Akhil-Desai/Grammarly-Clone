import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React from "react";

interface HeaderProps {
  title?: string;
  score?: number;
  onTitleChange?: (title: string) => void;
  performance?: {
    words: number;
    chars: number;
    sentences: number;
    readingSeconds: number;
    speakingSeconds: number;
    score: number;
  };
}

const Header = ({ title = "Untitled document", score, onTitleChange, performance }: HeaderProps) => {
  const scoreLabel = typeof score === "number" ? `${score} Overall score` : undefined;
  const [open, setOpen] = React.useState(false);

  return (
    <header className="bg-transparent">
      <div className="mx-auto max-w-3xl px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Go to home" className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </Link>
          {onTitleChange ? (
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled document"
              className="text-base font-medium text-foreground bg-transparent outline-none border-b border-transparent focus:border-muted-foreground/30"
            />
          ) : (
            <h1 className="text-base font-medium text-foreground">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {scoreLabel && performance && performance.words > 0 ? (
            <>
              <Button size="sm" variant="ghost" className="border rounded-full px-3" onClick={() => setOpen(true)}>
                {scoreLabel}
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Performance</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-foreground/80 max-w-xl">
                      Text score: {performance.score} out of 100. This score represents the quality of writing in this document.
                      You can increase it by addressing suggestions.
                    </p>
                    <div className="shrink-0 ml-6">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-600 opacity-90" />
                        <div className="absolute inset-1 rounded-full border-4 border-emerald-600/20" />
                        <div className="absolute inset-0 flex items-center justify-center text-emerald-700 font-semibold">
                          {performance.score}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-xl font-semibold mb-3">Word count</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3">
                      <div className="text-sm text-muted-foreground">Characters</div>
                      <div className="text-teal-700 font-semibold">{performance.chars.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground sm:col-start-3">Reading time</div>
                      <div className="text-sm text-muted-foreground">Words</div>
                      <div className="text-teal-700 font-semibold">{performance.words.toLocaleString()}</div>
                      <div className="text-teal-700 font-semibold sm:col-start-3">
                        {Math.floor(performance.readingSeconds / 60)} min {performance.readingSeconds % 60} sec
                      </div>
                      <div className="text-sm text-muted-foreground">Sentences</div>
                      <div className="text-teal-700 font-semibold">{performance.sentences.toLocaleString()}</div>
                      <div className="text-teal-700 font-semibold sm:col-start-3">
                        {Math.floor(performance.speakingSeconds / 60)} min {performance.speakingSeconds % 60} sec
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
