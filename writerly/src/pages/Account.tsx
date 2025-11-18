import React from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const Masked = ({ length = 8 }: { length?: number }) => {
  return <span>{"•".repeat(Math.max(6, length))}</span>;
};

const Row: React.FC<{
  label: string;
  value: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ label, value, actionLabel = "Update", onAction }) => {
  return (
    <div className="py-5 border-b">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-lg">{value}</div>
        <Button variant="ghost" size="sm" onClick={onAction} className="text-muted-foreground">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const onUpdateEmail = async () => {
    const next = window.prompt("Update your email", user?.email || "");
    if (typeof next === "string" && next.trim()) {
      // Placeholder UX only; backend does not yet support email updates
      toast({ title: "Email update requested", description: "Email updates are not enabled in this demo." });
    }
  };

  const onUpdatePassword = async () => {
    // Placeholder UX only; backend does not yet support password updates
    toast({ title: "Password update", description: "Password changes are not enabled in this demo." });
  };

  const score = 100; // not used on this page UI, but Header expects a score

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <Header title="Profile" score={score} onOpenGoals={() => {}} onTitleChange={() => {}} />
          <div className="mx-auto max-w-3xl w-full px-6 py-8">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>
            <div className="bg-card rounded-lg border">
              <div className="px-6">
                <Row label="Email" value={user?.email || "Unknown"} onAction={onUpdateEmail} />
                <Row label="Password" value={<Masked />} onAction={onUpdatePassword} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;


