import { useMemo, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Network } from "lucide-react"
import { cn } from "@/lib/utils"

export type TypeKind = "interface" | "abstract" | "class" | "final" | "enum" | "record"

export interface TypeNode {
  id: string
  name: string
  kind: TypeKind
  /** id of the parent node — omit for roots */
  parent?: string
  /** one-line summary shown in the detail panel */
  detail: string
  /** short tag rendered next to the name, e.g. "O(1) lookup" */
  tag?: string
}

interface TypeHierarchyDiagramProps {
  nodes: TypeNode[]
  title?: string
  /** id of the node selected when the diagram first renders */
  initialSelected?: string
}

const KIND_STYLES: Record<TypeKind, { label: string; chip: string; card: string }> = {
  interface: {
    label: "interface",
    chip: "bg-primary/15 text-primary",
    card: "border-primary/40 border-dashed",
  },
  abstract: {
    label: "abstract",
    chip: "bg-violet-500/15 text-violet-500 dark:text-violet-300",
    card: "border-violet-500/40",
  },
  class: { label: "class", chip: "bg-muted text-muted-foreground", card: "border-border" },
  final: { label: "final class", chip: "bg-success/15 text-success", card: "border-success/40" },
  enum: { label: "enum", chip: "bg-amber-500/15 text-amber-600 dark:text-amber-300", card: "border-amber-500/40" },
  record: { label: "record", chip: "bg-sky-500/15 text-sky-600 dark:text-sky-300", card: "border-sky-500/40" },
}

interface TreeItem {
  node: TypeNode
  children: TreeItem[]
}

function buildTree(nodes: TypeNode[]): TreeItem[] {
  const items = new Map<string, TreeItem>(nodes.map((node) => [node.id, { node, children: [] }]))
  const roots: TreeItem[] = []
  for (const node of nodes) {
    const item = items.get(node.id)!
    const parent = node.parent ? items.get(node.parent) : undefined
    if (parent) {
      parent.children.push(item)
    } else {
      roots.push(item)
    }
  }
  return roots
}

function TreeBranch({
  item,
  depth,
  selected,
  onSelect,
}: {
  item: TreeItem
  depth: number
  selected: string
  onSelect: (id: string) => void
}) {
  const styles = KIND_STYLES[item.node.kind]
  const isSelected = selected === item.node.id

  return (
    <li className={cn("relative", depth > 0 && "pl-5 before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-border")}>
      <div
        className={cn(
          "relative py-1",
          depth > 0 && "before:absolute before:top-4.5 before:-left-5 before:h-px before:w-5 before:bg-border",
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(item.node.id)}
          aria-pressed={isSelected}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
            styles.card,
            isSelected ? "bg-primary/10 ring-2 ring-primary/50" : "bg-card hover:bg-accent/50",
          )}
        >
          <span className="font-mono-code text-[12.5px] font-medium text-foreground">{item.node.name}</span>
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", styles.chip)}>{styles.label}</span>
          {item.node.tag ? (
            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">{item.node.tag}</span>
          ) : null}
        </button>
      </div>
      {item.children.length > 0 ? (
        <ul>
          {item.children.map((child) => (
            <TreeBranch key={child.node.id} item={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/**
 * A clickable type tree. Java's libraries are hierarchies first and classes
 * second — you can't choose between `HashSet` and `TreeSet` without seeing that
 * both are `Set`, which is a `Collection`. Selecting a node explains what that
 * particular type adds over its parent.
 */
export function TypeHierarchyDiagram({ nodes, title = "Type hierarchy", initialSelected }: TypeHierarchyDiagramProps) {
  const prefersReducedMotion = useReducedMotion()
  const tree = useMemo(() => buildTree(nodes), [nodes])
  const [selected, setSelected] = useState(initialSelected ?? nodes[0]?.id ?? "")

  const selectedNode = nodes.find((node) => node.id === selected) ?? nodes[0]

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground">
        <Network className="size-4 text-primary" aria-hidden="true" />
        {title}
      </div>

      <div className="overflow-x-auto p-4">
        <ul className="min-w-max">
          {tree.map((item) => (
            <TreeBranch key={item.node.id} item={item} depth={0} selected={selected} onSelect={setSelected} />
          ))}
        </ul>
      </div>

      <AnimatePresence mode="wait">
        {selectedNode ? (
          <motion.div
            key={selectedNode.id}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="border-t bg-muted/40 px-4 py-3"
          >
            <p className="font-mono-code text-[12.5px] font-semibold text-foreground">{selectedNode.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground [&_code]:font-mono-code [&_code]:text-foreground">
              {selectedNode.detail}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
