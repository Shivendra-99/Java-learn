import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Menu, Moon, Sun, Coffee, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { CommandPalette } from "@/components/layout/command-palette"
import { useTheme } from "@/context/theme-context"

/** True when focus is somewhere the user is actually typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
}

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((prev) => !prev)
      } else if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open lesson navigation"
        >
          <Menu className="size-5" />
        </Button>

        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Coffee className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Java Learn</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Search lessons</span>
            <kbd className="ml-1 hidden rounded border bg-background px-1.5 py-0.5 font-mono-code text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-left text-base">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Coffee className="size-3.5" aria-hidden="true" />
              </span>
              Java Learn
            </SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
