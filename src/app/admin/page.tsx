"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, Save, RefreshCw, CheckCircle, AlertCircle, Youtube, Plus, X,
    LayoutDashboard, Lightbulb, Globe, FileText, PlusCircle, Newspaper, MapPin, Trash2, Calendar, Instagram, Settings, Search, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const SubmissionMapPreview = dynamic(() => import("@/components/SubmissionMapPreview"), { ssr: false });
const MapPinManager = dynamic(() => import("@/components/MapPinManager"), { ssr: false });

function AdminDashboardContent() {
    const searchParams = useSearchParams();
    const key = searchParams.get("key");
    const [loading, setLoading] = useState(false);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [status, setStatus] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("news");
    const [skatemapSub, setSkatemapSub] = useState<"pending" | "remove">("pending");
    const [pendingCount, setPendingCount] = useState(0);

    // Settings State
    const [settings, setSettings] = useState<any>({ youtubeChannels: [], newsSources: [], instagramHashtags: [] });
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Edit State
    const [editingYoutubeIndex, setEditingYoutubeIndex] = useState<number | null>(null);
    const [ytName, setYtName] = useState("");
    const [ytId, setYtId] = useState("");

    const [editingNewsIndex, setEditingNewsIndex] = useState<number | null>(null);
    const [newsName, setNewsName] = useState("");
    const [newsUrl, setNewsUrl] = useState("");
    const [newsSelector, setNewsSelector] = useState("");
    const [newsType, setNewsType] = useState<"rss" | "html">("rss");

    useEffect(() => {
        if (activeTab === 'settings') {
            loadSettings();
        }
    }, [activeTab]);

    const loadSettings = async () => {
        try {
            setSettingsLoading(true);
            const res = await fetch(`/api/settings?key=${key}`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveSettings = async (newSettings: any) => {
        try {
            setSettings(newSettings); // Optimistic update
            const res = await fetch(`/api/settings?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: newSettings, key })
            });
            if (!res.ok) throw new Error("Failed to save");
        } catch (e) {
            alert("Failed to save settings");
            loadSettings(); // Revert
        }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await fetch(`/api/map/pending?key=${key}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setPendingCount(data.length);
            }
        } catch (e) {
            console.error("Error fetching pending count:", e);
        }
    };

    useEffect(() => {
        if (key) fetchPendingCount();
    }, [key]);

    if (!key) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center p-8 border border-destructive rounded-lg bg-destructive/10">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">Please provide a valid secret key in the URL.</p>
                    <code className="block mt-4 bg-black/10 p-2 rounded text-sm">?key=YOUR_SECRET</code>
                </div>
            </div>
        );
    }

    const scanNews = async () => {
        setLoading(true);
        setStatus("Scanning for news... (this may take 20s)");
        try {
            const res = await fetch(`/api/cron/scrape?mode=draft&key=${key}`);
            const data = await res.json();

            if (data.articles) {
                setDrafts(data.articles);
                setStatus(`Found ${data.articles.length} new articles!`);
            } else {
                setStatus(data.message || "No new articles found.");
            }
        } catch (error) {
            console.error(error);
            setStatus("Error scanning for news.");
        } finally {
            setLoading(false);
        }
    };

    const savePost = async (post: any, index: number) => {
        try {
            const res = await fetch(`/api/posts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post: {
                        ...post,
                        status: 'published',
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    },
                    key
                })
            });

            if (res.ok) {
                // Remove from drafts
                const newDrafts = [...drafts];
                newDrafts.splice(index, 1);
                setDrafts(newDrafts);
                alert("Post published successfully!");
            } else {
                alert("Failed to save post.");
            }
        } catch (error) {
            console.error(error);
            alert("Error saving post.");
        }
    };

    const updateDraft = (index: number, field: string, value: string) => {
        const newDrafts = [...drafts];
        newDrafts[index][field] = value;
        setDrafts(newDrafts);
    };



    const tabs = [
        { id: "news", label: "News & Scraper", icon: Newspaper },
        { id: "custom", label: "Neuer Post", icon: PlusCircle },
        { id: "learn", label: "Lern-Center", icon: Lightbulb },
        { id: "community", label: "Community", icon: Globe },
        { id: "events", label: "Events", icon: Calendar },
        { id: "submissions", label: "Skatemap", icon: MapPin, badge: pendingCount },
        { id: "settings", label: "Scanner Settings", icon: Settings },
        { id: "about", label: "About", icon: FileText },
        { id: "posts", label: "Live Posts", icon: FileText }
    ];

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl relative">
            {/* Top Navigation Header */}
            <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border-2 border-border p-4 rounded-[2rem] shadow-xl">
                <div className="flex items-center gap-3 px-4">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Admin</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{key.substring(0, 4)}**** active</p>
                        </div>
                    </div>
                </div>



                <nav className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 rounded-2xl font-black uppercase italic text-[11px] transition-all group relative",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform")} />
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-background">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="w-full">
                {/* Main Content Area */}
                <div className="w-full min-w-0">

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {activeTab === "settings" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                                            <Settings className="h-6 w-6 text-primary" /> Scanner Settings
                                        </h2>

                                        {/* YouTube Channels */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2 text-red-500">
                                                <Youtube className="h-5 w-5" /> YouTube Channels
                                            </h3>
                                            <div className="grid gap-3 mb-4">
                                                {settings.youtubeChannels?.map((channel: any, idx: number) => (
                                                    <div key={idx} className={cn(
                                                        "flex items-center justify-between bg-muted/30 p-3 rounded-lg border transition-all",
                                                        editingYoutubeIndex === idx ? "border-primary bg-primary/5" : "border-border"
                                                    )}>
                                                        <div className="flex-1">
                                                            <div className="font-bold">{channel.name}</div>
                                                            <div className="text-xs font-mono text-muted-foreground">{channel.id}</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingYoutubeIndex(idx);
                                                                    setYtName(channel.name);
                                                                    setYtId(channel.id);
                                                                    document.getElementById('yt-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }}
                                                                className="p-2 hover:bg-primary/10 text-primary rounded-full transition-colors"
                                                            >
                                                                <Settings className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm("Delete this channel?")) {
                                                                        const newChannels = settings.youtubeChannels.filter((_: any, i: number) => i !== idx);
                                                                        saveSettings({ ...settings, youtubeChannels: newChannels });
                                                                        if (editingYoutubeIndex === idx) {
                                                                            setEditingYoutubeIndex(null);
                                                                            setYtName("");
                                                                            setYtId("");
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div id="yt-form-container" className={cn(
                                                "flex gap-2 items-end bg-card p-4 rounded-xl border transition-all shadow-sm",
                                                editingYoutubeIndex !== null ? "border-primary ring-2 ring-primary/20" : "border-border"
                                            )}>
                                                <div className="flex-1 grid gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Channel Name</label>
                                                    <input
                                                        value={ytName}
                                                        onChange={(e) => setYtName(e.target.value)}
                                                        placeholder="Channel Name"
                                                        className="w-full p-2 bg-muted/50 border border-input rounded text-sm font-bold"
                                                    />
                                                </div>
                                                <div className="flex-1 grid gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Channel ID</label>
                                                    <input
                                                        value={ytId}
                                                        onChange={(e) => setYtId(e.target.value)}
                                                        placeholder="Channel ID"
                                                        className="w-full p-2 bg-muted/50 border border-input rounded font-mono text-sm"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    {editingYoutubeIndex !== null && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingYoutubeIndex(null);
                                                                setYtName("");
                                                                setYtId("");
                                                            }}
                                                            className="px-4 py-2 hover:bg-muted text-muted-foreground rounded font-bold text-sm uppercase"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (ytName && ytId) {
                                                                let newChannels = [...(settings.youtubeChannels || [])];
                                                                if (editingYoutubeIndex !== null) {
                                                                    newChannels[editingYoutubeIndex] = { name: ytName, id: ytId };
                                                                } else {
                                                                    newChannels.push({ name: ytName, id: ytId });
                                                                }
                                                                saveSettings({ ...settings, youtubeChannels: newChannels });
                                                                setEditingYoutubeIndex(null);
                                                                setYtName("");
                                                                setYtId("");
                                                            }
                                                        }}
                                                        className="px-6 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-bold text-sm uppercase shadow-lg shadow-primary/20"
                                                    >
                                                        {editingYoutubeIndex !== null ? "Update" : "Add"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-border my-8" />

                                        {/* News Sources */}
                                        <div className="mb-8">
                                            <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2 text-blue-500">
                                                <Newspaper className="h-5 w-5" /> News Sources
                                            </h3>
                                            <div className="grid gap-3 mb-4">
                                                {settings.newsSources?.map((source: any, idx: number) => (
                                                    <div key={idx} className={cn(
                                                        "flex items-center justify-between bg-muted/30 p-3 rounded-lg border transition-all",
                                                        editingNewsIndex === idx ? "border-primary bg-primary/5" : "border-border"
                                                    )}>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold">{source.name}</div>
                                                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-background rounded border border-border">{source.type || 'rss'}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">{source.url}</div>
                                                            {source.selector && <div className="text-[10px] font-mono text-muted-foreground bg-muted p-1 rounded inline-block mt-1">{source.selector}</div>}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingNewsIndex(idx);
                                                                    setNewsName(source.name);
                                                                    setNewsUrl(source.url);
                                                                    setNewsSelector(source.selector || "");
                                                                    setNewsType(source.type || "rss");
                                                                    document.getElementById('news-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }}
                                                                className="p-2 hover:bg-primary/10 text-primary rounded-full transition-colors"
                                                            >
                                                                <Settings className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm("Delete this source?")) {
                                                                        const newSources = settings.newsSources.filter((_: any, i: number) => i !== idx);
                                                                        saveSettings({ ...settings, newsSources: newSources });
                                                                        if (editingNewsIndex === idx) {
                                                                            setEditingNewsIndex(null);
                                                                            setNewsName("");
                                                                            setNewsUrl("");
                                                                            setNewsSelector("");
                                                                            setNewsType("rss");
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-full transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div id="news-form-container" className={cn(
                                                "flex flex-col gap-4 bg-card p-4 rounded-xl border transition-all shadow-sm",
                                                editingNewsIndex !== null ? "border-primary ring-2 ring-primary/20" : "border-border"
                                            )}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Source Name</label>
                                                        <input
                                                            value={newsName}
                                                            onChange={(e) => setNewsName(e.target.value)}
                                                            placeholder="Source Name"
                                                            className="w-full p-2 bg-muted/50 border border-input rounded text-sm font-bold"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Type</label>
                                                        <select
                                                            value={newsType}
                                                            onChange={(e) => setNewsType(e.target.value as "rss" | "html")}
                                                            className="w-full p-2 bg-muted/50 border border-input rounded text-sm font-bold"
                                                        >
                                                            <option value="rss">RSS Feed</option>
                                                            <option value="html">HTML Scraper</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">URL</label>
                                                    <input
                                                        value={newsUrl}
                                                        onChange={(e) => setNewsUrl(e.target.value)}
                                                        placeholder="URL (e.g. https://site.com/rss)"
                                                        className="w-full p-2 bg-muted/50 border border-input rounded text-sm font-mono"
                                                    />
                                                </div>
                                                {newsType === 'html' && (
                                                    <div className="grid gap-2">
                                                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">CSS Selector</label>
                                                        <input
                                                            value={newsSelector}
                                                            onChange={(e) => setNewsSelector(e.target.value)}
                                                            placeholder="CSS Selector (e.g. article)"
                                                            className="w-full p-2 bg-muted/50 border border-input rounded font-mono text-sm"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex gap-2 justify-end mt-2">
                                                    {editingNewsIndex !== null && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingNewsIndex(null);
                                                                setNewsName("");
                                                                setNewsUrl("");
                                                                setNewsSelector("");
                                                                setNewsType("rss");
                                                            }}
                                                            className="px-4 py-2 hover:bg-muted text-muted-foreground rounded font-bold text-sm uppercase"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (newsName && newsUrl) {
                                                                let newSources = [...(settings.newsSources || [])];
                                                                const newSource = {
                                                                    name: newsName,
                                                                    url: newsUrl,
                                                                    selector: newsSelector,
                                                                    type: newsType
                                                                };

                                                                if (editingNewsIndex !== null) {
                                                                    newSources[editingNewsIndex] = newSource;
                                                                } else {
                                                                    newSources.push(newSource);
                                                                }
                                                                saveSettings({ ...settings, newsSources: newSources });
                                                                setEditingNewsIndex(null);
                                                                setNewsName("");
                                                                setNewsUrl("");
                                                                setNewsSelector("");
                                                                setNewsType("rss");
                                                            }
                                                        }}
                                                        className="px-6 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-bold text-sm uppercase shadow-lg shadow-primary/20"
                                                    >
                                                        {editingNewsIndex !== null ? "Update Source" : "Add Source"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-border my-8" />

                                        {/* Instagram Hashtags */}
                                        <div>
                                            <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2 text-pink-500">
                                                <Instagram className="h-5 w-5" /> Instagram Hashtags
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {settings.instagramHashtags?.map((tag: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border">
                                                        <span className="font-bold">#{tag}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newTags = settings.instagramHashtags.filter((_: string, i: number) => i !== idx);
                                                                saveSettings({ ...settings, instagramHashtags: newTags });
                                                            }}
                                                            className="hover:text-destructive transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 max-w-sm">
                                                <input id="new-hashtag" placeholder="Hashtag (without #)" className="flex-1 p-2 bg-muted/50 border border-input rounded" />
                                                <button
                                                    onClick={() => {
                                                        const tagInput = document.getElementById('new-hashtag') as HTMLInputElement;
                                                        if (tagInput.value) {
                                                            const newTags = [...(settings.instagramHashtags || []), tagInput.value.replace(/^#/, '')];
                                                            saveSettings({ ...settings, instagramHashtags: newTags });
                                                            tagInput.value = "";
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-bold text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "news" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                    <div className="flex flex-wrap gap-4 p-6 bg-muted/30 rounded-2xl border border-border items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold uppercase italic tracking-tight">Content Scraper</h2>
                                            <p className="text-sm text-muted-foreground">{status || "Ready to scan for new content."}</p>
                                        </div>
                                        <div className="flex gap-4 flex-wrap">
                                            <button
                                                onClick={scanNews}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                            >
                                                {loading && status.includes('news') ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                                {loading && status.includes('news') ? "Scanning..." : "Scan News"}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setLoading(true);
                                                    setStatus("Scanning YouTube channels...");
                                                    try {
                                                        const res = await fetch(`/api/cron/youtube?key=${key}`);
                                                        const data = await res.json();
                                                        if (data.articles) {
                                                            setDrafts(prev => [...data.articles, ...prev]);
                                                            setStatus(`Found ${data.articles.length} videos!`);
                                                        } else {
                                                            setStatus("No videos found.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        setStatus("Error scanning YouTube.");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20"
                                            >
                                                {loading && status.includes('YouTube') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                                                {loading && status.includes('YouTube') ? "Scanning..." : "Scan YouTube"}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const hashtag = prompt("Enter Hashtag (without #):", "skateboarding");
                                                    if (!hashtag) return;

                                                    setLoading(true);
                                                    setStatus(`Scanning Instagram for #${hashtag}...`);
                                                    try {
                                                        const res = await fetch(`/api/instagram/scan?key=${key}&hashtag=${hashtag}`);
                                                        const data = await res.json();
                                                        if (data.articles) {
                                                            setDrafts(prev => [...data.articles, ...prev]);
                                                            setStatus(`Found Top 3 Bangers for #${hashtag}!`);
                                                        } else {
                                                            setStatus(data.message || "No posts found.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        setStatus("Error scanning Instagram.");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-all shadow-lg shadow-pink-600/20"
                                            >
                                                {loading && status.includes('Instagram') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
                                                {loading && status.includes('Instagram') ? "Scanning..." : "Scan Insta"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {drafts.map((draft, index) => (
                                            <div key={index} className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm hover:border-primary/50 transition-colors">
                                                <div className="grid gap-6">
                                                    <div>
                                                        <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Title</label>
                                                        <input
                                                            type="text"
                                                            value={draft.title}
                                                            onChange={(e) => updateDraft(index, 'title', e.target.value)}
                                                            className="w-full p-3 bg-muted/20 border border-input rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Description</label>
                                                        <textarea
                                                            value={draft.description}
                                                            onChange={(e) => updateDraft(index, 'description', e.target.value)}
                                                            className="w-full p-3 bg-muted/20 border border-input rounded-xl h-24 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Media Content</label>
                                                        {draft.type === 'instagram-mix' ? (
                                                            <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-input">
                                                                {(() => {
                                                                    let items = [];
                                                                    try {
                                                                        items = draft.content.trim().startsWith('[') ? JSON.parse(draft.content) : [];
                                                                    } catch (e) { items = []; }
                                                                    // Default to 3 empty items if parsing fails or empty
                                                                    if (items.length === 0) items = [{}, {}, {}];

                                                                    return items.map((item: any, i: number) => (
                                                                        <div key={i} className="p-3 bg-background border border-border rounded-lg shadow-sm">
                                                                            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                                                                <Instagram className="h-3 w-3" /> Video {i + 1}
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Instagram Video URL"
                                                                                value={item.url || ''}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...items];
                                                                                    newItems[i] = { ...newItems[i], url: e.target.value };
                                                                                    updateDraft(index, 'content', JSON.stringify(newItems));
                                                                                }}
                                                                                className="w-full p-2 mb-2 bg-muted/30 border border-input rounded text-sm font-mono"
                                                                            />
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="@username"
                                                                                    value={item.author || ''}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...items];
                                                                                        newItems[i] = { ...newItems[i], author: e.target.value };
                                                                                        updateDraft(index, 'content', JSON.stringify(newItems));
                                                                                    }}
                                                                                    className="w-full p-2 bg-muted/30 border border-input rounded text-sm"
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Profile URL"
                                                                                    value={item.authorUrl || ''}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...items];
                                                                                        newItems[i] = { ...newItems[i], authorUrl: e.target.value };
                                                                                        updateDraft(index, 'content', JSON.stringify(newItems));
                                                                                    }}
                                                                                    className="w-full p-2 bg-muted/30 border border-input rounded text-sm font-mono"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ));
                                                                })()}
                                                                <p className="text-[10px] text-muted-foreground text-center">Auto-saved as JSON</p>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={draft.content.startsWith('http') && draft.type === 'link' ? '' : draft.content}
                                                                onChange={(e) => updateDraft(index, 'content', e.target.value)}
                                                                className="w-full p-3 bg-muted/20 border border-input rounded-xl text-sm font-mono text-muted-foreground"
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-center pt-4 border-t border-border">
                                                        <span className="text-xs font-bold px-3 py-1 bg-muted rounded-full uppercase">{draft.type}</span>
                                                        <button
                                                            onClick={() => savePost(draft, index)}
                                                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            Publish Post
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {drafts.length === 0 && !loading && (
                                            <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-3xl">
                                                <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                                                <p className="text-muted-foreground font-bold italic uppercase">Keine Entwürfe vorhanden. Scan starten!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "custom" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-sm">
                                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                                            <PlusCircle className="text-primary" /> Manuellen Post erstellen
                                        </h2>
                                        <div className="grid gap-8">
                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Post Titel</label>
                                                <input
                                                    type="text"
                                                    id="new-post-title"
                                                    placeholder="Was gibt's Neues?"
                                                    className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl font-bold text-xl focus:border-primary/50 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Primärer Typ</label>
                                                    <select id="new-post-type" className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl font-bold outline-none cursor-pointer">
                                                        <option value="image">Bild-Post (oder Multi-Media)</option>
                                                        <option value="video">YouTube Video</option>
                                                        <option value="text">Reiner Text</option>
                                                        <option value="link">Externer Link</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Tags (kommagetrennt)</label>
                                                    <input
                                                        type="text"
                                                        id="new-post-tags"
                                                        placeholder="skating, berlin, news"
                                                        className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl font-bold outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Multi-Media Section */}
                                            <div className="p-6 bg-muted/10 border-2 border-dashed border-border rounded-2xl space-y-6">
                                                <h4 className="text-sm font-black uppercase tracking-widest border-b border-border pb-2">Multi-Media Assets</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Bild URLs (kommagetrennt)</label>
                                                        <textarea
                                                            id="new-post-media-images"
                                                            className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl font-mono text-xs outline-none focus:border-primary/50"
                                                            placeholder="https://... , https://..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Video URL (YouTube)</label>
                                                            <input
                                                                type="text"
                                                                id="new-post-media-video"
                                                                className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl text-xs font-mono outline-none focus:border-primary/50"
                                                                placeholder="https://youtube.com/watch?v=..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Dazugehöriger Link</label>
                                                            <input
                                                                type="text"
                                                                id="new-post-media-link"
                                                                className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl text-xs font-mono outline-none focus:border-primary/50"
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-muted-foreground italic">
                                                    Hinweis: Wenn du hier Media-Assets angibst, werden diese bevorzugt verwendet.
                                                    Das Feld "Inhalt" unten kann dann für zusätzlichen Text genutzt werden.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Inhalt (Zusatztext)</label>
                                                <textarea
                                                    id="new-post-content"
                                                    className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl h-48 font-mono text-sm outline-none focus:border-primary/50 transition-all"
                                                    placeholder="Dein Text hier..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black uppercase mb-2 text-muted-foreground tracking-widest">Kurzbeschreibung (Optional)</label>
                                                <input
                                                    type="text"
                                                    id="new-post-description"
                                                    className="w-full p-4 bg-muted/20 border-2 border-border rounded-xl outline-none"
                                                    placeholder="Zusammenfassung..."
                                                />
                                            </div>

                                            <div className="sticky bottom-6 z-50">
                                                <button
                                                    onClick={() => {
                                                        const title = (document.getElementById('new-post-title') as HTMLInputElement).value;
                                                        const type = (document.getElementById('new-post-type') as HTMLSelectElement).value;
                                                        const content = (document.getElementById('new-post-content') as HTMLTextAreaElement).value;
                                                        const description = (document.getElementById('new-post-description') as HTMLInputElement).value;
                                                        const tagsStr = (document.getElementById('new-post-tags') as HTMLInputElement).value;

                                                        // Media items
                                                        const images = (document.getElementById('new-post-media-images') as HTMLTextAreaElement).value.split(',').map(s => s.trim()).filter(s => s);
                                                        const videoUrl = (document.getElementById('new-post-media-video') as HTMLInputElement).value;
                                                        const externalLink = (document.getElementById('new-post-media-link') as HTMLInputElement).value;

                                                        if (!title) {
                                                            alert("Titel ist ein Pflichtfeld!");
                                                            return;
                                                        }

                                                        const newPost = {
                                                            id: `post_${Date.now()}`,
                                                            title,
                                                            type,
                                                            content: content || (images[0] || videoUrl || externalLink || ""),
                                                            description,
                                                            tags: tagsStr.split(',').map(t => t.trim()).filter(t => t),
                                                            date: new Date().toLocaleDateString('de-DE', { month: 'short', day: 'numeric', year: 'numeric' }),
                                                            status: 'published',
                                                            media: {
                                                                images,
                                                                videoUrl,
                                                                externalLink
                                                            },
                                                            translations: {
                                                                de: { title, content: content || description },
                                                                en: { title, content: content || description }
                                                            }
                                                        };

                                                        fetch(`/api/posts/create`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ post: newPost, key })
                                                        }).then(res => {
                                                            if (res.ok) {
                                                                alert("Post wurde veröffentlicht! 🛹");
                                                                // Clear fields
                                                                ['new-post-title', 'new-post-content', 'new-post-description', 'new-post-tags', 'new-post-media-images', 'new-post-media-video', 'new-post-media-link'].forEach(id => {
                                                                    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
                                                                    if (el) el.value = '';
                                                                });
                                                            } else {
                                                                alert("Fehler beim Veröffentlichen.");
                                                            }
                                                        });
                                                    }}
                                                    className="w-full py-4 bg-primary text-primary-foreground font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-2xl shadow-primary/20 border-2 border-primary/20 backdrop-blur-sm"
                                                >
                                                    <PlusCircle className="h-5 w-5" />
                                                    Post jetzt erstellen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "learn" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <ManageLearn keyStr={key || ''} />
                                </motion.div>
                            )}

                            {activeTab === "community" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <ManageCommunity keyStr={key || ''} />
                                </motion.div>
                            )}

                            {activeTab === "about" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <ManageAbout keyStr={key || ''} />
                                </motion.div>
                            )}

                            {activeTab === "submissions" && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    {/* Sub Navigation */}
                                    <div className="flex gap-2 p-1 bg-muted/30 border border-border rounded-2xl w-fit">
                                        <button
                                            onClick={() => setSkatemapSub("pending")}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                skatemapSub === "pending" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            Neue Einsendungen ({pendingCount})
                                        </button>
                                        <button
                                            onClick={() => setSkatemapSub("remove")}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                skatemapSub === "remove" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            Pins entfernen
                                        </button>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {skatemapSub === "pending" ? (
                                            <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                <ManageSubmissions keyStr={key || ''} onCountUpdate={setPendingCount} />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="remove" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                <MapPinManager keyStr={key || ''} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {activeTab === "events" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <ManageEvents keyStr={key || ''} />
                                </motion.div>
                            )}

                            {activeTab === "posts" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <ManagePosts keyStr={key || ''} />
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}

function ManageCommunity({ keyStr }: { keyStr: string }) {
    const { t } = useLanguage();
    const [data, setData] = useState<any>({ sections: [] });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/community');
            const json = await res.json();
            setData(json);
            // Auto-expand first section
            if (json.sections && json.sections.length > 0) {
                setExpandedSection(json.sections[0].id);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load community data.");
        } finally {
            setLoading(false);
        }
    };

    const authenticatedSave = (newData: any) => {
        fetch('/api/community', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${keyStr}`
            },
            body: JSON.stringify(newData)
        }).then(res => {
            if (res.ok) {
                alert("Saved!");
                setData(newData);
            } else {
                alert("Failed to save. Check your secret key.");
            }
        });
    }

    const resizeImage = (file: File, maxWidth: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Canvas is empty'));
                        }
                    }, 'image/jpeg', 0.8);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleUpload = async (file: File, sectionId: string, itemId: string) => {
        setUploading(itemId);

        try {
            const resizedFile = await resizeImage(file, 800);

            const formData = new FormData();
            formData.append('file', resizedFile);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${keyStr}`
                },
                body: formData
            });
            if (res.ok) {
                const json = await res.json();

                const newData = { ...data };
                const section = newData.sections.find((s: any) => s.id === sectionId);
                const item = section.items.find((i: any) => i.id === itemId);
                item.image = json.url;

                authenticatedSave(newData);
            } else {
                alert("Upload failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error uploading.");
        } finally {
            setUploading(null);
        }
    };

    useState(() => {
        fetchData();
    });

    const addSection = () => {
        const title = prompt("New Section Title:");
        if (!title) return;
        const newData = { ...data };
        const newSectionId = `sec_${Date.now()}`;
        newData.sections.push({
            id: newSectionId,
            title,
            items: []
        });
        setExpandedSection(newSectionId);
        authenticatedSave(newData);
    };

    const deleteSection = (sectionIndex: number) => {
        if (!confirm("Delete this entire section?")) return;
        const newData = { ...data };
        newData.sections.splice(sectionIndex, 1);
        authenticatedSave(newData);
    };

    const addItem = (sectionIndex: number) => {
        const newData = { ...data };
        newData.sections[sectionIndex].items.push({
            id: `item_${Date.now()}`,
            name: "New Item",
            url: "#",
            description: "Description...",
            image: ""
        });
        authenticatedSave(newData);
    };

    const deleteItem = (sectionIndex: number, itemIndex: number) => {
        if (!confirm("Delete this item?")) return;
        const newData = { ...data };
        newData.sections[sectionIndex].items.splice(itemIndex, 1);
        authenticatedSave(newData);
    };

    const updateItem = (sectionIndex: number, itemIndex: number, field: string, value: string) => {
        const newData = { ...data };
        newData.sections[sectionIndex].items[itemIndex][field] = value;
        setData(newData);
    };

    const updateSectionTitle = (sectionIndex: number, title: string) => {
        const newData = { ...data };
        newData.sections[sectionIndex].title = title;
        setData(newData);
    };

    return (
        <div className="space-y-6">
            {loading && <div className="text-center py-8">Loading...</div>}

            {data.sections.map((section: any, sIdx: number) => {
                const isExpanded = expandedSection === section.id;

                return (
                    <div key={section.id} className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Section Header */}
                        <div
                            className={cn(
                                "p-6 cursor-pointer transition-colors",
                                isExpanded ? "bg-primary/5 border-b-2 border-border" : "hover:bg-muted/30"
                            )}
                            onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={cn(
                                        "p-2 rounded-xl transition-colors",
                                        isExpanded ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase italic tracking-tight">
                                            {section.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono mt-1">
                                            {section.items.length} {section.items.length === 1 ? 'Item' : 'Items'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newTitle = prompt("Section Title:", section.title);
                                            if (newTitle) {
                                                updateSectionTitle(sIdx, newTitle);
                                                authenticatedSave(data);
                                            }
                                        }}
                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                        title="Edit Title"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSection(sIdx);
                                        }}
                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                        title="Delete Section"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <div className={cn(
                                        "p-2 transition-transform",
                                        isExpanded && "rotate-180"
                                    )}>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 space-y-4">
                                        {section.items.map((item: any, iIdx: number) => (
                                            <div key={item.id} className="bg-muted/20 border-2 border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* Left Column - Main Info */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Name</label>
                                                            <input
                                                                className="w-full p-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                value={item.name}
                                                                onChange={(e) => updateItem(sIdx, iIdx, 'name', e.target.value)}
                                                                placeholder="Name"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Bundesland</label>
                                                                <input
                                                                    className="w-full p-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    value={item.state || ""}
                                                                    onChange={(e) => updateItem(sIdx, iIdx, 'state', e.target.value)}
                                                                    placeholder="z.B. Bayern"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">URL</label>
                                                                <input
                                                                    className="w-full p-2 bg-background border border-input rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    value={item.url}
                                                                    onChange={(e) => updateItem(sIdx, iIdx, 'url', e.target.value)}
                                                                    placeholder="https://..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Anschrift</label>
                                                            <input
                                                                className="w-full p-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                value={item.address || ""}
                                                                onChange={(e) => updateItem(sIdx, iIdx, 'address', e.target.value)}
                                                                placeholder="Straße, PLZ Stadt"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Öffnungszeiten</label>
                                                            <input
                                                                className="w-full p-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                value={item.hours || ""}
                                                                onChange={(e) => updateItem(sIdx, iIdx, 'hours', e.target.value)}
                                                                placeholder="Mo-Fr 10-18 Uhr"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Right Column - Image & Description */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase mb-2 text-muted-foreground tracking-widest">Bild</label>
                                                            <div className="flex items-start gap-3">
                                                                {item.image && (
                                                                    <img
                                                                        src={item.image}
                                                                        className="h-20 w-20 object-cover rounded-lg border-2 border-border"
                                                                        alt="preview"
                                                                    />
                                                                )}
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], section.id, item.id)}
                                                                        className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                                                                        disabled={uploading === item.id}
                                                                    />
                                                                    {uploading === item.id && (
                                                                        <span className="text-xs ml-2 animate-pulse text-primary font-bold">Uploading...</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Beschreibung</label>
                                                            <textarea
                                                                className="w-full p-2 bg-background border border-input rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(sIdx, iIdx, 'description', e.target.value)}
                                                                placeholder="Kurze Beschreibung..."
                                                                rows={4}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Item Actions */}
                                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                                                    <button
                                                        onClick={() => deleteItem(sIdx, iIdx)}
                                                        className="px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="inline h-3 w-3 mr-1" />
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => authenticatedSave(data)}
                                                        className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                                    >
                                                        <Save className="inline h-3 w-3 mr-1" />
                                                        Save Item
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Item Button */}
                                        <button
                                            onClick={() => addItem(sIdx)}
                                            className="w-full py-3 border-2 border-dashed border-muted-foreground/30 rounded-xl text-muted-foreground hover:bg-muted/20 hover:border-primary/50 hover:text-primary font-bold uppercase text-xs transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Item to {section.title}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Add Section Button */}
            <button
                onClick={addSection}
                className="w-full py-4 bg-foreground text-background font-black uppercase italic rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
                <PlusCircle className="h-5 w-5" />
                Add New Section
            </button>

            {/* Sticky Save Bar */}
            <div className="sticky bottom-6 z-50">
                <button
                    onClick={() => authenticatedSave(data)}
                    className="w-full py-4 bg-primary text-primary-foreground font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-2xl shadow-primary/20 border-2 border-primary/20 backdrop-blur-sm"
                >
                    <Save className="h-5 w-5" />
                    {t("buttons.save")} Community Changes
                </button>
            </div>
        </div>
    );
}

function ManageAbout({ keyStr }: { keyStr: string }) {
    const { t } = useLanguage();
    const [aboutData, setAboutData] = useState<any>({ de: {}, en: {} });
    const [loading, setLoading] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState<'de' | 'en'>('de');

    useEffect(() => {
        fetchAboutData();
    }, []);

    const fetchAboutData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/about');
            const data = await res.json();
            setAboutData(data);
        } catch (e) {
            console.error(e);
            alert("Failed to load about content.");
        } finally {
            setLoading(false);
        }
    };

    const saveAboutData = async () => {
        try {
            const res = await fetch('/api/about', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ about: aboutData, key: keyStr })
            });
            if (res.ok) {
                alert("About page updated!");
            } else {
                alert("Failed to save. Check your secret key.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving data.");
        }
    };

    const updateField = (lang: 'de' | 'en', field: string, value: string) => {
        setAboutData({
            ...aboutData,
            [lang]: {
                ...aboutData[lang],
                [field]: value
            }
        });
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    const currentLang = aboutData[activeLanguage] || {};
    const fields = ['title', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

    return (
        <div className="space-y-8">
            {/* Language Switcher */}
            <div className="flex gap-2 p-1 bg-muted/30 border border-border rounded-2xl w-fit">
                <button
                    onClick={() => setActiveLanguage('de')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeLanguage === 'de' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    🇩🇪 Deutsch
                </button>
                <button
                    onClick={() => setActiveLanguage('en')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeLanguage === 'en' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    🇬🇧 English
                </button>
            </div>

            {/* Content Editor */}
            <div className="space-y-6">
                {fields.map((field) => (
                    <div key={field} className="bg-card border-2 border-border rounded-2xl p-6">
                        <label className="block text-xs font-black uppercase mb-3 text-muted-foreground tracking-widest">
                            {field === 'title' ? 'Title' : field.toUpperCase()}
                        </label>
                        <textarea
                            value={currentLang[field] || ''}
                            onChange={(e) => updateField(activeLanguage, field, e.target.value)}
                            className="w-full p-4 bg-muted/20 border border-input rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            rows={field === 'title' ? 1 : field === 'p3' ? 2 : 4}
                            placeholder={`Enter ${field}...`}
                        />
                    </div>
                ))}
            </div>

            {/* Sticky Save Bar */}
            <div className="sticky bottom-6 z-50">
                <button
                    onClick={saveAboutData}
                    className="w-full py-4 bg-primary text-primary-foreground font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-2xl shadow-primary/20 border-2 border-primary/20 backdrop-blur-sm"
                >
                    <Save className="h-5 w-5" />
                    {t("buttons.save")} About Page ({activeLanguage.toUpperCase()})
                </button>
            </div>
        </div>
    );
}

function ManageEvents({ keyStr }: { keyStr: string }) {
    const { t } = useLanguage();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/events');
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const saveEvents = async (newEvents: any[]) => {
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: newEvents, key: keyStr })
            });
            if (res.ok) {
                alert("Events saved successfully!");
                setEvents(newEvents);
            } else {
                alert("Failed to save events.");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving events.");
        }
    };

    const addEvent = () => {
        const newEvent = {
            id: `event_${Date.now()}`,
            title: "New Event",
            date: "Coming Soon",
            startDateUtc: new Date().toISOString().split('T')[0],
            location: "TBA",
            link: "",
            description: "",
            flyerUrl: ""
        };
        setEditingEvent(newEvent);
        setShowEditModal(true);
    };

    const addEventForDate = (date: Date) => {
        const newEvent = {
            id: `event_${Date.now()}`,
            title: "New Event",
            date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            startDateUtc: date.toISOString().split('T')[0],
            location: "TBA",
            link: "",
            description: "",
            flyerUrl: ""
        };
        setEditingEvent(newEvent);
        setShowEditModal(true);
    };

    const updateEvent = (field: string, value: string) => {
        if (editingEvent) {
            setEditingEvent({ ...editingEvent, [field]: value });
        }
    };

    const saveEditedEvent = () => {
        if (!editingEvent) return;

        const existingIndex = events.findIndex(e => e.id === editingEvent.id);
        let newEvents;

        if (existingIndex >= 0) {
            newEvents = [...events];
            newEvents[existingIndex] = editingEvent;
        } else {
            newEvents = [editingEvent, ...events];
        }

        saveEvents(newEvents);
        setShowEditModal(false);
        setEditingEvent(null);
    };

    const deleteEvent = (eventId: string) => {
        if (!confirm("Delete this event?")) return;
        const newEvents = events.filter(e => e.id !== eventId);
        saveEvents(newEvents);
        setShowEditModal(false);
        setEditingEvent(null);
    };

    const openEditModal = (event: any) => {
        setEditingEvent({ ...event });
        setShowEditModal(true);
    };

    // Calendar logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getEventsForDate = (date: Date | null) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => event.startDateUtc === dateStr);
    };

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Event Kalender</h2>
                <button
                    onClick={addEvent}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" /> Neues Event
                </button>
            </div>

            {loading && <div className="text-sm">Loading events...</div>}

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between bg-card border-2 border-border rounded-2xl p-4">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black uppercase italic">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-xs font-bold uppercase bg-muted hover:bg-muted/70 rounded transition-colors"
                    >
                        Heute
                    </button>
                </div>

                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-card border-2 border-border rounded-2xl p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-black uppercase text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, index) => {
                        const dayEvents = getEventsForDate(day);
                        const isToday = day && day.toDateString() === new Date().toDateString();

                        return (
                            <div
                                key={index}
                                onClick={() => day && dayEvents.length === 0 && addEventForDate(day)}
                                className={cn(
                                    "min-h-[100px] p-2 rounded-lg border-2 transition-all",
                                    day ? "bg-background border-border hover:border-primary/50" : "bg-muted/20 border-transparent",
                                    isToday && "ring-2 ring-primary",
                                    day && dayEvents.length === 0 && "cursor-pointer hover:bg-primary/5"
                                )}
                            >
                                {day && (
                                    <>
                                        <div className={cn(
                                            "text-sm font-bold mb-1",
                                            isToday && "text-primary"
                                        )}>
                                            {day.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.map(event => (
                                                <button
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(event);
                                                    }}
                                                    className="w-full text-left px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-[10px] font-bold uppercase truncate transition-colors"
                                                    title={event.title}
                                                >
                                                    {event.title}
                                                </button>
                                            ))}
                                            {dayEvents.length === 0 && (
                                                <div className="text-[10px] text-muted-foreground/50 italic text-center py-2">
                                                    Klicken zum Erstellen
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingEvent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-background border-2 border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase italic">Event bearbeiten</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingEvent(null);
                                }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Title</label>
                                <input
                                    type="text"
                                    value={editingEvent.title}
                                    onChange={(e) => updateEvent('title', e.target.value)}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Display Date</label>
                                    <input
                                        type="text"
                                        value={editingEvent.date}
                                        onChange={(e) => updateEvent('date', e.target.value)}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm"
                                        placeholder="z.B. 14-15. 02.2026"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Calendar Date</label>
                                    <input
                                        type="date"
                                        value={editingEvent.startDateUtc || ''}
                                        onChange={(e) => updateEvent('startDateUtc', e.target.value)}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Location</label>
                                <input
                                    type="text"
                                    value={editingEvent.location}
                                    onChange={(e) => updateEvent('location', e.target.value)}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Link (Optional)</label>
                                <input
                                    type="text"
                                    value={editingEvent.link || ''}
                                    onChange={(e) => updateEvent('link', e.target.value)}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg text-xs font-mono"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-2 text-muted-foreground tracking-widest">Flyer Image</label>

                                {/* File Upload */}
                                <div className="mb-3">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    updateEvent('flyerUrl', reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="flyer-upload"
                                    />
                                    <label
                                        htmlFor="flyer-upload"
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 border border-input rounded-lg cursor-pointer transition-colors text-sm font-bold"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Bild hochladen (JPEG/PNG)
                                    </label>
                                </div>

                                {/* OR Divider */}
                                <div className="flex items-center gap-3 my-3">
                                    <div className="flex-1 border-t border-border"></div>
                                    <span className="text-xs text-muted-foreground font-bold">ODER</span>
                                    <div className="flex-1 border-t border-border"></div>
                                </div>

                                {/* URL Input */}
                                <input
                                    type="text"
                                    value={editingEvent.flyerUrl || ''}
                                    onChange={(e) => updateEvent('flyerUrl', e.target.value)}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg text-xs font-mono"
                                    placeholder="https://... (Image URL)"
                                />

                                {/* Image Preview */}
                                {editingEvent.flyerUrl && (
                                    <div className="mt-3">
                                        <div className="text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Vorschau</div>
                                        <img
                                            src={editingEvent.flyerUrl}
                                            alt="Flyer preview"
                                            className="w-full max-h-48 object-contain bg-muted/20 rounded-lg border border-border"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Description</label>
                                <textarea
                                    value={editingEvent.description || ''}
                                    onChange={(e) => updateEvent('description', e.target.value)}
                                    className="w-full p-3 bg-muted/20 border border-input rounded-lg text-sm resize-none"
                                    rows={4}
                                    placeholder="Event details..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={saveEditedEvent}
                                className="flex-1 py-3 bg-primary text-primary-foreground font-black uppercase italic rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                <Save className="inline h-4 w-4 mr-2" />
                                Speichern
                            </button>
                            <button
                                onClick={() => deleteEvent(editingEvent.id)}
                                className="px-6 py-3 bg-destructive text-destructive-foreground font-black uppercase italic rounded-xl hover:opacity-90 transition-all"
                            >
                                <Trash2 className="inline h-4 w-4 mr-2" />
                                Löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {events.length === 0 && !loading && (
                <div className="text-center py-12 bg-muted/5 border-2 border-dashed border-border rounded-2xl">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground/20" />
                    <p className="text-muted-foreground text-sm italic">Keine Events gefunden. Klicke auf "Neues Event" um zu starten.</p>
                </div>
            )}
        </div>
    );
}

function ManagePosts({ keyStr }: { keyStr: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Editing state
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            setPosts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Load on mount
    useState(() => {
        fetchPosts();
    });

    const deletePost = async (title: string) => {
        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

        try {
            const res = await fetch('/api/posts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, key: keyStr })
            });
            if (res.ok) {
                alert("Post deleted.");
                fetchPosts(); // Refresh list
            } else {
                alert("Failed to delete.");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting post.");
        }
    };

    const handleEditPost = (post: any) => {
        // Ensure post has the new media structure for editing convenience
        const postToEdit = {
            ...post,
            media: post.media || {
                images: post.type === 'image' ? [post.content] : [],
                videoUrl: post.type === 'video' ? post.content : '',
                externalLink: post.type === 'link' ? post.content : ''
            }
        };
        setEditingPost(postToEdit);
        setShowEditModal(true);
    };

    const updateEditingPost = (field: string, value: any) => {
        if (editingPost) {
            setEditingPost({ ...editingPost, [field]: value });
        }
    };

    const saveEditedPost = async () => {
        if (!editingPost) return;

        try {
            const res = await fetch('/api/posts/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post: editingPost, key: keyStr })
            });

            if (res.ok) {
                alert("Post updated!");
                setShowEditModal(false);
                setEditingPost(null);
                fetchPosts();
            } else {
                alert("Update failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating post.");
        }
    };

    const filteredPosts = posts
        .filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
                (post.description && post.description.toLowerCase().includes(search.toLowerCase()));
            const matchesType = filterType === 'all' || post.type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border border-border">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Search Posts</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find post..."
                            className="w-full pl-9 p-2 bg-muted/50 border border-input rounded-lg text-sm"
                        />
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full p-2 bg-muted/50 border border-input rounded-lg text-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="video">Video</option>
                            <option value="image">Image</option>
                            <option value="text">Text</option>
                        </select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Sort</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                            className="w-full p-2 bg-muted/50 border border-input rounded-lg text-sm"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchPosts}
                    title="Refresh"
                    className="p-2.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </button>
            </div>

            <div className="grid gap-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase text-muted-foreground px-4 mb-2">
                    <div>{filteredPosts.length} Posts Found</div>
                    <div>Archive</div>
                </div>

                {filteredPosts.map((post, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group">
                        <div className="flex items-center gap-4 overflow-hidden">
                            {(post.media?.images?.[0] || post.type === 'image' || (post.type === 'video' && post.content?.includes('youtube'))) ? (
                                <img
                                    src={post.media?.images?.[0] || (post.type === 'video' ? `https://img.youtube.com/vi/${post.content.split('v=')[1]?.split('&')[0]}/default.jpg` : post.content)}
                                    className="w-12 h-12 object-cover rounded-lg bg-muted border border-border"
                                    alt="thumbnail"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ) : (
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                                    TXT
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="font-bold truncate pr-4 text-sm group-hover:text-primary transition-colors">{post.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className="uppercase font-bold bg-muted px-1.5 py-0.5 rounded">{post.type}</span>
                                    <span>{post.date}</span>
                                    {post.source && <span className="truncate max-w-[100px]">• {post.source}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditPost(post)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Edit Post"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => deletePost(post.title)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Delete Post"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {!loading && filteredPosts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm italic">No posts match your filters.</p>
                    </div>
                )}
            </div>

            {/* Edit Post Modal */}
            {showEditModal && editingPost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-background border-2 border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase italic">Post bearbeiten</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingPost(null);
                                }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Titel</label>
                                <input
                                    type="text"
                                    value={editingPost.title}
                                    onChange={(e) => updateEditingPost('title', e.target.value)}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Beschreibung</label>
                                <textarea
                                    value={editingPost.description || ''}
                                    onChange={(e) => updateEditingPost('description', e.target.value)}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Typ</label>
                                    <select
                                        value={editingPost.type}
                                        onChange={(e) => updateEditingPost('type', e.target.value)}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm"
                                    >
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                        <option value="text">Text</option>
                                        <option value="link">Link</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Datum</label>
                                    <input
                                        type="text"
                                        value={editingPost.date}
                                        onChange={(e) => updateEditingPost('date', e.target.value)}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Media Section */}
                            <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest border-b border-border pb-2">Media Assets</h4>

                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Bild URLs (kommagetrennt)</label>
                                    <input
                                        type="text"
                                        value={editingPost.media?.images?.join(', ') || ''}
                                        onChange={(e) => {
                                            const images = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                            updateEditingPost('media', { ...editingPost.media, images });
                                        }}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-xs font-mono"
                                        placeholder="https://... , https://..."
                                    />
                                    {editingPost.media?.images?.length > 0 && (
                                        <div className="flex gap-2 mt-2 overflow-x-auto py-2">
                                            {editingPost.media.images.map((img: string, i: number) => (
                                                <img key={i} src={img} className="h-16 w-16 object-cover rounded border border-border flex-shrink-0" alt="preview" />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Video URL (YouTube)</label>
                                    <input
                                        type="text"
                                        value={editingPost.media?.videoUrl || ''}
                                        onChange={(e) => updateEditingPost('media', { ...editingPost.media, videoUrl: e.target.value })}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-xs font-mono"
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Externer Link</label>
                                    <input
                                        type="text"
                                        value={editingPost.media?.externalLink || ''}
                                        onChange={(e) => updateEditingPost('media', { ...editingPost.media, externalLink: e.target.value })}
                                        className="w-full p-2 bg-muted/20 border border-input rounded-lg text-xs font-mono"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest">Tags (kommagetrennt)</label>
                                <input
                                    type="text"
                                    value={editingPost.tags?.join(', ') || ''}
                                    onChange={(e) => updateEditingPost('tags', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                    className="w-full p-2 bg-muted/20 border border-input rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={saveEditedPost}
                                className="flex-1 py-3 bg-primary text-primary-foreground font-black uppercase italic rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                <Save className="inline h-4 w-4 mr-2" />
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function ManageLearn({ keyStr }: { keyStr: string }) {
    const { t } = useLanguage();
    const [data, setData] = useState<any>({ basics: [], coaches: [], randomizer: { beginner: [], intermediate: [], pro: [] }, channels: [] });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/learn');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const authenticatedSave = (newData: any) => {
        fetch('/api/learn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${keyStr}`
            },
            body: JSON.stringify(newData)
        }).then(res => {
            if (res.ok) {
                alert("Saved Learn Data!");
                setData(newData);
            } else {
                alert("Failed to save Learn Data.");
            }
        });
    };

    useState(() => { fetchData(); });

    const updateItem = (category: string, index: number, field: string, value: string) => {
        const newData = { ...data };
        newData[category][index][field] = value;
        setData(newData);
    };

    const addItem = (category: string, defaultObj: any) => {
        const newData = { ...data };
        newData[category].push({ ...defaultObj, id: `${category}_${Date.now()}` });
        setData(newData);
    };

    const deleteItem = (category: string, index: number) => {
        if (!confirm("Delete this?")) return;
        const newData = { ...data };
        newData[category].splice(index, 1);
        setData(newData);
    };

    const updateTrick = (level: string, index: number, value: string) => {
        const newData = { ...data };
        newData.randomizer[level][index] = value;
        setData(newData);
    };

    const addTrick = (level: string) => {
        const newData = { ...data };
        newData.randomizer[level].push("New Trick");
        setData(newData);
    };

    const deleteTrick = (level: string, index: number) => {
        const newData = { ...data };
        newData.randomizer[level].splice(index, 1);
        setData(newData);
    };

    if (loading) return <div>Loading Learn Data...</div>;

    return (
        <div className="space-y-12">
            {/* Basics Section */}
            <div className="bg-card border border-border p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 flex justify-between">Basics (Videos) <button onClick={() => addItem('basics', { title: 'New', description: '', videoUrl: '' })} className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">+ Add</button></h3>
                <div className="space-y-4">
                    {data.basics.map((b: any, idx: number) => (
                        <div key={b.id} className="p-4 border rounded bg-muted/20 flex flex-col gap-2 relative">
                            <button onClick={() => deleteItem('basics', idx)} className="absolute top-2 right-2 text-destructive text-xs">Delete</button>
                            <input className="w-full p-2 border rounded font-bold" value={b.title} onChange={e => updateItem('basics', idx, 'title', e.target.value)} placeholder="Title" />
                            <input className="w-full p-2 border rounded text-xs" value={b.videoUrl} onChange={e => updateItem('basics', idx, 'videoUrl', e.target.value)} placeholder="Video URL" />
                            <textarea className="w-full p-2 border rounded text-sm" value={b.description} onChange={e => updateItem('basics', idx, 'description', e.target.value)} placeholder="Description" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Coaches Section */}
            <div className="bg-card border border-border p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 flex justify-between">Skateboard Coaches <button onClick={() => addItem('coaches', { name: 'Coach Name', location: '', state: '', contact: '', description: '' })} className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">+ Add</button></h3>
                <div className="space-y-4">
                    {data.coaches.map((c: any, idx: number) => (
                        <div key={c.id} className="p-4 border rounded bg-muted/20 relative grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => deleteItem('coaches', idx)} className="absolute top-2 right-2 text-destructive text-xs">Delete</button>
                            <div className="space-y-2">
                                <input className="w-full p-2 border rounded font-bold" value={c.name} onChange={e => updateItem('coaches', idx, 'name', e.target.value)} placeholder="Name" />
                                <input className="w-full p-2 border rounded text-sm" value={c.location} onChange={e => updateItem('coaches', idx, 'location', e.target.value)} placeholder="City / Location" />
                                <input className="w-full p-2 border rounded text-sm" value={c.state} onChange={e => updateItem('coaches', idx, 'state', e.target.value)} placeholder="Bundesland" />
                            </div>
                            <div className="space-y-2">
                                <input className="w-full p-2 border rounded text-sm" value={c.contact} onChange={e => updateItem('coaches', idx, 'contact', e.target.value)} placeholder="Contact (Email/Link)" />
                                <textarea className="w-full p-2 border rounded text-sm h-20" value={c.description} onChange={e => updateItem('coaches', idx, 'description', e.target.value)} placeholder="Description" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Randomizer Section */}
            <div className="bg-card border border-border p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 uppercase italic">Trick Randomizer Lists</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['beginner', 'intermediate', 'pro'] as const).map(lvl => (
                        <div key={lvl} className="space-y-2">
                            <h4 className="font-bold uppercase text-muted-foreground border-b pb-1 flex justify-between items-center">
                                {lvl} <Plus size={16} className="cursor-pointer hover:text-foreground" onClick={() => addTrick(lvl)} />
                            </h4>
                            {data.randomizer[lvl].map((trick: string, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center group">
                                    <input
                                        className="flex-1 p-1 bg-background border rounded text-xs"
                                        value={trick}
                                        onChange={e => updateTrick(lvl, idx, e.target.value)}
                                    />
                                    <X size={14} className="cursor-pointer text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteTrick(lvl, idx)} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Channels Section */}
            <div className="bg-card border border-border p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 flex justify-between">Learning Channels <button onClick={() => addItem('channels', { name: 'Channel', description: '', url: '' })} className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">+ Add</button></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.channels.map((ch: any, idx: number) => (
                        <div key={ch.id} className="p-4 border rounded bg-muted/20 relative">
                            <button onClick={() => deleteItem('channels', idx)} className="absolute top-2 right-2 text-destructive text-xs">Delete</button>
                            <input className="w-full p-2 border rounded font-bold mb-2" value={ch.name} onChange={e => updateItem('channels', idx, 'name', e.target.value)} placeholder="Name" />
                            <input className="w-full p-2 border rounded text-xs mb-2" value={ch.url} onChange={e => updateItem('channels', idx, 'url', e.target.value)} placeholder="URL" />
                            <input className="w-full p-2 border rounded text-sm" value={ch.description} onChange={e => updateItem('channels', idx, 'description', e.target.value)} placeholder="Short Info" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="sticky bottom-6 z-50">
                <button
                    onClick={() => authenticatedSave(data)}
                    className="w-full py-4 bg-primary text-primary-foreground font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-2xl shadow-primary/20 border-2 border-primary/20 backdrop-blur-sm"
                >
                    <Save className="h-5 w-5" />
                    {t("buttons.save")} ALL LEARN CHANGES
                </button>
            </div>
        </div>
    );
}

function ManageSubmissions({ keyStr, onCountUpdate }: { keyStr: string; onCountUpdate: (count: number) => void }) {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);


    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/map/pending?key=${keyStr}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSubmissions(data);
                onCountUpdate(data.length);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject', updatedSpot?: any) => {
        if (action === 'reject' && !confirm("Diesen Eintrag wirklich löschen?")) return;

        try {
            const res = await fetch(`/api/map/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, key: keyStr, action, updatedSpot })
            });

            if (res.ok) {
                alert(`Spot ${action === 'approve' ? 'akzeptiert' : 'gelöscht'}!`);
                fetchSubmissions();
            } else {
                alert("Fehler bei der Verarbeitung.");
            }
        } catch (e) {
            console.error(e);
            alert("Netzwerkfehler.");
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground uppercase font-black italic">Warte auf Einsendungen...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Karteneinsendungen</h2>
                    <p className="text-muted-foreground">Neue Spots von der Community prüfen.</p>
                </div>
                <button onClick={fetchSubmissions} className="p-2 bg-muted rounded-xl hover:text-primary transition-colors">
                    <RefreshCw size={20} />
                </button>
            </header>

            <div className="grid gap-6">
                {submissions.map((sub: any) => (
                    <div key={sub.id} className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm hover:border-primary/30 transition-all">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Media Preview */}
                            <div className="w-full md:w-48 h-48 bg-muted rounded-2xl overflow-hidden flex items-center justify-center relative group">
                                {sub.mediaUrl ? (
                                    <img src={sub.mediaUrl} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="text-muted-foreground/20 italic font-black uppercase text-xs">Kein Bild</div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                    <p className="text-white text-[10px] uppercase font-bold text-center">Eingereicht am: <br />{new Date(sub.submittedAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Map Preview */}
                            <div className="w-full md:w-48 h-48 bg-muted rounded-2xl overflow-hidden relative group border-2 border-border">
                                <SubmissionMapPreview location={sub.location} />
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/80 backdrop-blur-md rounded-md text-[8px] font-bold uppercase z-[1000]">Live Preview</div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block ${sub.category === 'shop' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {sub.category}
                                        </span>
                                        <input
                                            className="block text-2xl font-black uppercase italic tracking-tighter bg-transparent border-none focus:outline-none w-full"
                                            value={sub.name}
                                            onChange={(e) => {
                                                const newSubs = [...submissions];
                                                const idx = newSubs.findIndex(s => s.id === sub.id);
                                                newSubs[idx].name = e.target.value;
                                                setSubmissions(newSubs);
                                            }}
                                        />
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Eingereicht von:</span>
                                            <span className="text-[10px] font-black uppercase italic text-primary bg-primary/5 px-2 py-0.5 rounded-md">{sub.contributor || 'Anonym'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(sub.id, 'reject')}
                                            className="p-3 bg-destructive/10 text-destructive rounded-2xl hover:bg-destructive hover:text-white transition-all"
                                            title="Ablehnen"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleAction(sub.id, 'approve', sub)}
                                            className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white font-black uppercase italic rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                                        >
                                            <CheckCircle size={20} />
                                            Akzeptieren
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Standort / Maps Link</label>
                                        <textarea
                                            className="w-full p-4 bg-muted/30 border border-border rounded-xl text-sm font-medium focus:border-primary/40 outline-none transition-all resize-none"
                                            rows={2}
                                            value={sub.location}
                                            onChange={(e) => {
                                                const newSubs = [...submissions];
                                                const idx = newSubs.findIndex(s => s.id === sub.id);
                                                newSubs[idx].location = e.target.value;
                                                setSubmissions(newSubs);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Zusatzinfos / Beschreibung</label>
                                        <textarea
                                            className="w-full p-4 bg-muted/30 border border-border rounded-xl text-sm font-medium focus:border-primary/40 outline-none transition-all resize-none"
                                            rows={2}
                                            value={sub.description || ''}
                                            onChange={(e) => {
                                                const newSubs = [...submissions];
                                                const idx = newSubs.findIndex(s => s.id === sub.id);
                                                newSubs[idx].description = e.target.value;
                                                setSubmissions(newSubs);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bild URL</label>
                                        <input
                                            className="w-full p-2 bg-muted/30 border border-border rounded-lg text-xs font-mono"
                                            value={sub.mediaUrl || ''}
                                            onChange={(e) => {
                                                const newSubs = [...submissions];
                                                const idx = newSubs.findIndex(s => s.id === sub.id);
                                                newSubs[idx].mediaUrl = e.target.value;
                                                setSubmissions(newSubs);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">YouTube / Video</label>
                                        <input
                                            className="w-full p-2 bg-muted/30 border border-border rounded-lg text-xs font-mono"
                                            value={sub.youtubeUrl || ''}
                                            onChange={(e) => {
                                                const newSubs = [...submissions];
                                                const idx = newSubs.findIndex(s => s.id === sub.id);
                                                newSubs[idx].youtubeUrl = e.target.value;
                                                setSubmissions(newSubs);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {submissions.length === 0 && (
                    <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-[2.5rem]">
                        <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-black uppercase italic tracking-widest">Keine neuen Einsendungen</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading Admin...</div>}>
            <AdminDashboardContent />
        </Suspense>
    )
}
