import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Persian legal markdown renderer — HTML disabled (XSS posture, docs/07). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-fa", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
