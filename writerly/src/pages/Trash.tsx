import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router-dom";

const Trash = () => {
  const { authorizedFetch } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authorizedFetch("/api/deleted-documents");
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}
        if (!res.ok) throw new Error(data?.error || text || "Failed to load trash");
        if (!cancelled) setDocs(Array.isArray(data?.documents) ? data.documents : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load trash");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authorizedFetch]);

  async function restoreDoc(id: string) {
    const res = await authorizedFetch(`/api/deleted-documents/${id}/restore`, { method: "POST" });
    if (!res.ok) {
      const t = await res.text(); alert(t || "Restore failed"); return;
    }
    setDocs(prev => prev.filter(d => d.id !== id));
    navigate("/");
  }

  async function purgeDoc(id: string) {
    if (!confirm("Permanently delete this document? This cannot be undone.")) return;
    const res = await authorizedFetch(`/api/deleted-documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const t = await res.text(); alert(t || "Delete failed"); return;
    }
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar mimic from Home for quick nav */}
      <aside className="w-60 shrink-0 border-r">
        <div className="h-16 flex items-center px-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">writerly</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/60 text-muted-foreground">
            <FileText className="w-4 h-4" />
            Docs
          </Link>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm bg-muted">
            <Trash2 className="w-4 h-4" />
            Trash
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        <div className="h-16 flex items-center justify-between px-8 border-b">
          <h1 className="text-2xl font-semibold">Trash</h1>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="text-sm text-destructive">Error: {error}</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No deleted documents.</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {docs.map((d: any) => (
                <Card key={d.id} className="h-full">
                  <CardContent className="p-4">
                    <div className="font-medium">{d.title || "Untitled doc"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Deleted {new Date(d.deleted_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 pt-3">
                      <Button size="sm" variant="outline" onClick={() => restoreDoc(d.id)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => purgeDoc(d.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-xs">Delete forever</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Trash;


