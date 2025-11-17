import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout";
import {
    Chrome,
    Laptop,
    Smartphone,
    Globe2,
    Code,
    FileText,
    Mail,
    Calendar,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    installed: boolean;
    category: "browser" | "desktop" | "mobile" | "productivity";
}

const integrations: Integration[] = [
    {
        id: "chrome-extension",
        name: "Chrome Extension",
        description: "Get writing suggestions directly in your browser",
        icon: <Chrome className="w-6 h-6" />,
        installed: false,
        category: "browser"
    },
    {
        id: "edge-extension",
        name: "Edge Extension",
        description: "Enhance your writing in Microsoft Edge",
        icon: <Laptop className="w-6 h-6" />,   // 修正
        installed: false,
        category: "browser"
    },
    {
        id: "desktop-app",
        name: "Desktop App",
        description: "Standalone application for Windows and macOS",
        icon: <Code className="w-6 h-6" />,
        installed: true,
        category: "desktop"
    },
    {
        id: "mobile-app",
        name: "Mobile App",
        description: "Write on the go with our iOS and Android apps",
        icon: <Smartphone className="w-6 h-6" />,   // 若报错 → 改成 IconPhone
        installed: false,
        category: "mobile"
    },
    {
        id: "google-docs",
        name: "Google Docs",
        description: "Integrate with Google Docs for seamless editing",
        icon: <FileText className="w-6 h-6" />,
        installed: true,
        category: "productivity"
    },
    {
        id: "gmail",
        name: "Gmail",
        description: "Improve your emails before sending",
        icon: <Mail className="w-6 h-6" />,
        installed: false,
        category: "productivity"
    },
    {
        id: "outlook",
        name: "Microsoft Outlook",
        description: "Enhance your Outlook emails",
        icon: <Mail className="w-6 h-6" />,
        installed: false,
        category: "productivity"
    },
    {
        id: "calendar",
        name: "Calendar Apps",
        description: "Improve your meeting invites and descriptions",
        icon: <Calendar className="w-6 h-6" />,
        installed: false,
        category: "productivity"
    }
];

export default function Apps() {
    const [integrationsList, setIntegrationsList] = useState<Integration[]>(integrations);

    const toggleIntegration = (id: string) => {
        setIntegrationsList(
            integrationsList.map(integration =>
                integration.id === id
                    ? { ...integration, installed: !integration.installed }
                    : integration
            )
        );
    };

    const getCategoryIntegrations = (category: string) => {
        return integrationsList.filter(integration => integration.category === category);
    };

    const installedCount = integrationsList.filter(i => i.installed).length;

    return (
        <Layout>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-2">Apps & Integrations</h1>
                <p className="text-muted-foreground mb-6">
                    Enhance your writing experience across platforms
                </p>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <div className="border rounded-md p-6">
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                                <CardDescription>
                                    Manage your connected apps
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Installed</div>
                                        <div className="text-2xl font-bold">{installedCount} / {integrationsList.length}</div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="font-medium mb-2">Categories</h3>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Browser Extensions</span>
                                                <span className="text-xs text-muted-foreground">{getCategoryIntegrations('browser').length}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Desktop Apps</span>
                                                <span className="text-xs text-muted-foreground">{getCategoryIntegrations('desktop').length}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Mobile Apps</span>
                                                <span className="text-xs text-muted-foreground">{getCategoryIntegrations('mobile').length}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Productivity</span>
                                                <span className="text-xs text-muted-foreground">{getCategoryIntegrations('productivity').length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <Tabs defaultValue="all">
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="browser">Browser</TabsTrigger>
                                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                                <TabsTrigger value="mobile">Mobile</TabsTrigger>
                                <TabsTrigger value="productivity">Productivity</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {integrationsList.map(integration => (
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onToggle={toggleIntegration}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="browser" className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {getCategoryIntegrations('browser').map(integration => (
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onToggle={toggleIntegration}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="desktop" className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {getCategoryIntegrations('desktop').map(integration => (
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onToggle={toggleIntegration}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="mobile" className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {getCategoryIntegrations('mobile').map(integration => (
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onToggle={toggleIntegration}
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="productivity" className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {getCategoryIntegrations('productivity').map(integration => (
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onToggle={toggleIntegration}
                                        />
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

interface IntegrationCardProps {
    integration: Integration;
    onToggle: (id: string) => void;
}

const IntegrationCard = ({ integration, onToggle }: IntegrationCardProps) => {
    return (
        <div className="border rounded-md h-full">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    {integration.icon}
                </div>
                <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <CardDescription>{integration.category}</CardDescription>
                </div>
                <div className="ml-auto">
                    <Switch
                        checked={integration.installed}
                        onCheckedChange={() => onToggle(integration.id)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {integration.description}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                {integration.installed ? (
                    <div className="flex items-center text-sm text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Installed
                    </div>
                ) : (
                    <div className="flex items-center text-sm text-amber-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Not installed
                    </div>
                )}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggle(integration.id)}
                >
                    {integration.installed ? "Disconnect" : "Connect"}
                </Button>
            </CardFooter>
        </div>
    );
};