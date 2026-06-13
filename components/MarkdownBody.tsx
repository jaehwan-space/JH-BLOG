import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { markdownSanitizeSchema } from "@/lib/markdown-schema";

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeSanitize, markdownSanitizeSchema], rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
