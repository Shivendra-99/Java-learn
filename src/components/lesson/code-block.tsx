import { useState } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { Check, Copy, FileCode2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  /** e.g. "bash", "diff", "yaml", "ini", "json", "js" */
  language?: string
  /** shown in the header, e.g. ".gitignore" or "terminal" */
  filename?: string
}

/**
 * A static, syntax-highlighted panel with a copy button. Most blocks in this
 * course are shell commands, so the copy button earns its place: the reader is
 * meant to run these against a real repository rather than read them.
 */
export function CodeBlock({ code, language = "bash", filename }: CodeBlockProps) {
  const trimmed = code.trim()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can fail (permissions, insecure context) — not worth
      // surfacing an error for what's ultimately a convenience button.
    }
  }

  return (
    <div className="not-prose overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <FileCode2 className="size-3.5" aria-hidden="true" />
          {filename ?? language}
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={copy}>
          {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="overflow-x-auto bg-[#0d1117] p-4 text-[13px] leading-relaxed">
        <Highlight code={trimmed} language={language} theme={themes.vsDark}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="min-w-max font-mono-code">
              {tokens.map((line, i) => {
                const { key: _lineKey, ...lineProps } = getLineProps({ line })
                return (
                  <div key={i} {...lineProps} className={cn(lineProps.className)}>
                    {line.map((token, key) => {
                      const { key: _tokenKey, ...tokenProps } = getTokenProps({ token })
                      return <span key={key} {...tokenProps} />
                    })}
                  </div>
                )
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  )
}
