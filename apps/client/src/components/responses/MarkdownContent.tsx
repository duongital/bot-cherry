import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentFormat } from "../../lib/types";

export default function MarkdownContent({
  content,
  format,
}: {
  content: string;
  format: ContentFormat;
}) {
  if (format === "markdown") {
    return (
      <div className="reader-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <div className="table-scroll">
                <table>{children}</table>
              </div>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return <pre className="plain-content">{content}</pre>;
}
