import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Clock, FileText, History, RotateCcw } from "lucide-react";

interface Version {
    id: string;
    document_id: string;
    version: number;
    created_at: string;
    content_preview: string;
    updated_by: string;
}

export default function VersionHistory() {
    const { id } = useParams<{ id: string }>();
    const { authorizedFetch } = useAuth();
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                setLoading(true);
                const endpoint = id
                    ? `/api/documents/${id}/versions`
                    : "/api/documents/versions";

                const response = await authorizedFetch(endpoint);

                if (!response.ok) {
                    throw new Error("Failed to fetch version history");
                }

                const data = await response.json();
                setVersions(data.versions || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                console.error("Error fetching versions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVersions();
    }, [authorizedFetch, id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const restoreVersion = async (documentId: string, versionId: string) => {
        try {
            const response = await authorizedFetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to restore version");
            }

            alert("Version restored successfully");
            window.location.reload();
        } catch (err) {
            console.error("Error restoring version:", err);
            alert("Failed to restore version");
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-6">Version History</h1>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-md p-6">
                                <div className="space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                </div>
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
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">
                        {id ? "Document Version History" : "All Version History"}
                    </h1>
                    {id && (
                        <Link to={`/doc/${id}`}>
                            <Button variant="outline">
                                <FileText className="w-4 h-4 mr-2" />
                                Back to Document
                            </Button>
                        </Link>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {versions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No version history</h3>
                        <p className="text-gray-600">
                            {id ? "This document has no version history yet" : "No version history available"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {versions.map((version) => (
                            <div key={version.id} className="border rounded-md p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Version {version.version} - {formatDate(version.created_at)}</h3>
                                    <Button
                                        size="sm"
                                        onClick={() => restoreVersion(version.document_id, version.id)}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Restore
                                    </Button>
                                </div>
                                <div className="text-sm text-muted-foreground mb-3">
                                    Updated by: {version.updated_by || "You"}
                                </div>
                                <div className="border rounded-md p-3 bg-muted/50 text-sm max-h-32 overflow-auto">
                                    {version.content_preview || "No content preview available"}
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Link to={`/doc/${version.document_id}?version=${version.version}`}>
                                        <Button size="sm" variant="outline">
                                            View this version
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}