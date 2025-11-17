import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Trash2, RotateCcw, X, AlertCircle } from "lucide-react";


interface TrashedDocument {
    id: string;
    title: string;
    deleted_at: string;
    version: number;
}

export default function Trash() {
    const { authorizedFetch } = useAuth();
    const [documents, setDocuments] = useState<TrashedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchTrashedDocuments();
    }, [authorizedFetch]);

    const fetchTrashedDocuments = async () => {
        try {
            setLoading(true);
            const response = await authorizedFetch("/api/documents/trash");

            if (!response.ok) {
                throw new Error("Failed to fetch trash");
            }

            const data = await response.json();
            setDocuments(data.documents || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
            console.error("Error fetching trash:", err);
        } finally {
            setLoading(false);
        }
    };

    const restoreDocument = async (id: string) => {
        try {
            const response = await authorizedFetch(`/api/documents/${id}/restore`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to restore document");
            }

            fetchTrashedDocuments();
        } catch (err) {
            console.error("Error restoring document:", err);
            alert("Failed to restore document");
        }
    };

    const permanentlyDeleteDocument = async (id: string) => {
        try {
            const response = await authorizedFetch(`/api/documents/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to delete document");
            }

            setShowDeleteDialog(false);
            fetchTrashedDocuments();
        } catch (err) {
            console.error("Error deleting document:", err);
            alert("Failed to delete document permanently");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-6">Trash</h1>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-md p-4 h-32">
                                <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Trash</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {documents.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Trash is empty</h3>
                        <p className="text-gray-600">
                            Documents you delete will appear here for 30 days
                        </p>
                    </div>
                ) : (
                    <>
                    <div className="mb-6 text-sm text-gray-600">
                            Documents in trash will be permanently deleted after 30 days.
                        </div>

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                        {documents.map((doc) => (
                                <div key={doc.id} className="border rounded-md h-full">
                                    <CardContent className="p-4">
                                        <Badge variant="destructive" className="mb-2">
                                            Deleted {formatDate(doc.deleted_at)}
                                        </Badge>
                                        <div className="space-y-3">
                                            <div className="font-medium truncate">{doc.title || "Untitled document"}</div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="flex-1 border rounded-md px-3 py-1 text-sm hover:bg-muted"
                                                    onClick={() => restoreDocument(doc.id)}
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-1" />
                                                    Restore
                                                </button>
                                                <button
                                                    className="flex-1 border rounded-md px-3 py-1 text-sm hover:bg-muted text-destructive"
                                                    onClick={() => {
                                                        setDocumentToDelete(doc.id);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            Permanently delete document?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="mb-4">
                        This action cannot be undone. The document will be permanently removed.
                    </p>
                    <DialogFooter>
                        <button
                            className="border rounded-md px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="border rounded-md px-4 py-2 text-sm bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => documentToDelete && permanentlyDeleteDocument(documentToDelete)}
                        >
                            Permanently delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}