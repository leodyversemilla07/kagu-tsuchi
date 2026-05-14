"use client";

import { Button } from "@workspace/ui/components/button";
import { Download, FileText, FileJs } from "@phosphor-icons/react";
import { toast } from "sonner";

interface ExportButtonProps {
  report: string;
  citations: string[];
  query: string;
}

export function ExportButton({ report, citations, query }: ExportButtonProps) {
  const exportAsMarkdown = () => {
    const content = `# ${query}\n\n${report}\n\n## Citations\n${citations.map((citation, i) => `${i + 1}. ${citation}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    downloadBlob(blob, `research-${Date.now()}.md`);
    toast.success("Report exported as Markdown");
  };

  const exportAsJSON = () => {
    const data = {
      query,
      report,
      citations,
      exportedAt: new Date().toISOString(),
      source: "Kagu-tsuchi AI Research Assistant"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `research-${Date.now()}.json`);
    toast.success("Report exported as JSON");
  };

  const exportAsPDF = async () => {
    try {
      // For PDF export, we'll create a simple HTML version and use browser's print to PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${query}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            p { margin: 10px 0; }
            ol { margin: 20px 0; }
            li { margin: 5px 0; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; }
            pre { background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>${query}</h1>
          <div>${report.replace(/\n/g, '<br>')}</div>
          ${citations.length > 0 ? `<h2>Citations</h2><ol>${citations.map(citation => `<li>${citation}</li>`).join('')}</ol>` : ''}
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        toast.success("PDF export opened in new window - use browser's print to save as PDF");
      } else {
        toast.error("Failed to open print window");
      }
    } catch (error) {
      toast.error("Failed to export as PDF");
      console.error("PDF export error:", error);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportAsMarkdown}>
        <FileText className="w-4 h-4 mr-2" />
        Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsJSON}>
        <FileJs className="w-4 h-4 mr-2" />
        JSON
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsPDF}>
        <Download className="w-4 h-4 mr-2" />
        PDF
      </Button>
    </div>
  );
}