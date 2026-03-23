"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  MessageSquare,
  FolderOpen,
  Blocks,
  Code,
  PanelLeftClose,
  PanelLeft,
  Paperclip,
  ArrowUp,
  PenLine,
  GraduationCap,
  Terminal,
  Briefcase,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const AI_NAV = [
  { label: "New chat", icon: Plus, action: "new" },
  { label: "Search", icon: Search, action: "search" },
  { label: "Chats", icon: MessageSquare, action: "chats" },
  { label: "Projects", icon: FolderOpen, action: "projects" },
  { label: "Artifacts", icon: Blocks, action: "artifacts" },
  { label: "Code", icon: Code, action: "code" },
];

const QUICK_ACTIONS = [
  { label: "Write", icon: PenLine },
  { label: "Learn", icon: GraduationCap },
  { label: "Code", icon: Terminal },
  { label: "Business", icon: Briefcase },
  { label: "AI's choice", icon: Sparkles },
];

export default function AiPage() {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [message]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
      {/* AI Sidebar */}
      <div
        className={cn(
          "shrink-0 border-r border-border bg-muted/30 flex flex-col transition-all duration-200 overflow-hidden",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="font-semibold text-base tracking-tight">AI Assistant</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-2 py-2 space-y-0.5">
          {AI_NAV.map((item) => (
            <button
              key={item.action}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Recents - empty state */}
        <div className="px-4 pt-4 flex-1 overflow-y-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Recents
          </p>
          <p className="text-xs text-muted-foreground/60 px-1">
            Your recent conversations will appear here.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with sidebar toggle */}
        <div className="h-12 shrink-0 flex items-center px-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl space-y-6">
            {/* Greeting */}
            <div className="text-center pb-4">
              <h1 className="text-3xl font-semibold tracking-tight">
                <span className="text-primary">*</span>{" "}
                {firstName} returns!
              </h1>
            </div>

            {/* Chat input */}
            <div className="rounded-2xl border border-border bg-muted/40 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can I help you today?"
                  rows={1}
                  className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 outline-none min-h-[24px] max-h-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // TODO: send message
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-3 pb-3">
                <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                  <Paperclip className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors">
                    <span>Sonnet 4.6</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    className={cn(
                      "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors",
                      message.trim()
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                    )}
                    disabled={!message.trim()}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick action chips */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
