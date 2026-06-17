"use client";

import {
  Clock,
  ClockCounterClockwise,
  Copy,
  Download,
  FileText,
  Trash,
  X,
} from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  type SearchHistoryItem,
  useSearchHistory,
} from "@/hooks/use-search-history";

interface SearchHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
  currentQuery: string;
}

export function SearchHistorySidebar({
  isOpen,
  onClose,
  onSelectQuery,
  currentQuery,
}: SearchHistorySidebarProps) {
  const { history, removeFromHistory, clearHistory } = useSearchHistory();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may be unavailable; fail silently
    }
  };

  const exportReport = (item: SearchHistoryItem) => {
    const content = `# ${item.query}\n\n${item.report}\n\n## Citations\n${item.citations.map((citation, i) => `${i + 1}. ${citation}`).join("\n")}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-${item.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default"
          onClick={onClose}
          aria-label="Close search history"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ClockCounterClockwise className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Search History</h2>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <ClockCounterClockwise className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No search history yet</p>
                  <p className="text-sm">
                    Your research queries will appear here
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <Card key={item.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium line-clamp-2">
                            {item.query}
                          </CardTitle>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(item.timestamp, {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.query)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportReport(item)}
                            className="h-6 w-6 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromHistory(item.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {truncateText(item.report, 150)}
                          </p>
                        </div>
                        {item.citations.length > 0 && (
                          <div>
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {item.citations.length} citation
                              {item.citations.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectQuery(item.query)}
                          className="w-full"
                          disabled={currentQuery === item.query}
                        >
                          Re-run Search
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
