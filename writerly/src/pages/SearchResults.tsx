import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Search, FileText, X } from "lucide-react";

interface Document {
    id: string;
    title: string;
    content_preview: string;
    updated_at: string;
}

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { authorizedFetch } = useAuth();
    const query = searchParams.get("query") || "";
    const [results, setResults] = useState<Document[]>([]);
    const [loading, setLoading] = useState(!!query);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        if (!query) return;

        const fetchSearchResults = async () => {
            try {
                setLoading(true);
                const response = await authorizedFetch(`/api/documents/search?query=${encodeURIComponent(query)}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch search results");
                }

                const data = await response.json();
                setResults(data.documents || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
                console.error("Error fetching search results:", err);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchSearchResults();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, authorizedFetch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim() !== query) {
            setSearchParams(searchInput.trim() ? { query: searchInput.trim() } : {});
        }
    };

    const clearSearch = () => {
        setSearchInput("");
        setSearchParams({});
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const highlightMatch = (text: string) => {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span className="bg-yellow-200">$1</span>');
    };

    return (
        <Layout>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Search Results</h1>

                <form onSubmit={handleSearch} className="relative max-w-2xl mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        className="pl-9 pr-10"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <Button type="submit" className="mt-2">Search</Button>
                </form>

                {!query ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Search for documents</h3>
                        <p className="text-gray-600">
                            Enter a search term to find relevant documents
                        </p>
                    </div>
                ) : loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-md p-6">
                                <div className="space-y-3">
                                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-1"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mt-4 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
                        {error}
                        <button
                            className="text-sm underline ml-2"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No results found</h3>
                        <p className="text-gray-600 mb-4">
                            We couldn't find any documents matching "{query}"
                        </p>
                        <Button onClick={clearSearch}>Clear search</Button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4 text-muted-foreground">
                            Found {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
                        </div>

                        <div className="space-y-4">
                            {results.map((doc) => (
                                <div key={doc.id} className="border rounded-md p-6">
                                    <Link to={`/doc/${doc.id}`} className="hover:no-underline">
                                        <div className="font-semibold text-lg mb-2"
                                             dangerouslySetInnerHTML={{ __html: highlightMatch(doc.title) }}
                                        />
                                    </Link>
                                    <div
                                        className="text-muted-foreground mb-4 text-sm line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: highlightMatch(doc.content_preview) }}
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-muted-foreground">
                                            Last edited: {formatDate(doc.updated_at)}
                                        </div>
                                        <Link to={`/doc/${doc.id}`}>
                                            <Button size="sm" variant="outline">View document</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}