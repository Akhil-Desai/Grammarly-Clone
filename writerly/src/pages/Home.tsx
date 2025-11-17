import { useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";

interface Document {
  id: string;
  title: string;
  updated_at: string;
  version: number;
}

interface CreateDocResponse {
  document: {
    id: string;
    title: string;
    updated_at: string;
    version: number;
  };
}

interface FetchDocsResponse {
  documents: Document[];
}

export default function Home() {
  const navigate = useNavigate();
  const { authorizedFetch } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);

  // ---------- LOAD DOCUMENTS ----------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingDocs(true);
      setDocsError(null);

      try {
        const res = await authorizedFetch("/api/documents");
        const rawText = await res.text();

        let data: FetchDocsResponse | null = null;

        try {
          data = rawText ? (JSON.parse(rawText) as FetchDocsResponse) : null;
        } catch (err) {
          console.error("JSON parse error:", err);
        }

        if (!res.ok) {
          throw new Error(data ? "Failed to load documents" : rawText);
        }

        if (!cancelled && data?.documents) {
          setDocuments(data.documents);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load documents";
        if (!cancelled) setDocsError(message);
      } finally {
        if (!cancelled) setLoadingDocs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorizedFetch]);

  // ---------- UI ----------
  return (
      <Layout>
        <div>
          <h1 className="text-2xl font-semibold mb-6">Your Documents</h1>

          {loadingDocs ? (
              <div className="text-sm text-gray-600">Loading documents…</div>
          ) : docsError ? (
              <div className="text-sm text-red-500">Error: {docsError}</div>
          ) : documents.length === 0 ? (
              <div className="text-sm text-gray-600">
                No documents yet. Click "New doc" to create your first one.
              </div>
          ) : (
              <>
                <h2 className="text-sm font-medium text-gray-600 mb-3">
                  Recent documents
                </h2>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {documents.map((doc) => (
                      <Link key={doc.id} to={`/doc/${doc.id}`} className="block">
                        <Card className="hover:shadow-lg transition-shadow h-full">
                          <CardContent className="p-4">
                            <Badge variant="secondary" className="mb-2">
                              v{doc.version}
                            </Badge>

                            <div className="space-y-2">
                              <div className="font-medium">
                                {doc.title || "Untitled document"}
                              </div>

                              <div className="text-xs text-gray-600">
                                Edited {new Date(doc.updated_at).toLocaleString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                  ))}
                </div>
              </>
          )}
        </div>
      </Layout>
  );
}