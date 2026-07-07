import { LayoutGrid, Plus } from "lucide-react";

interface BottomNavProps {
  currentTab: "dashboard" | "form";
  onChange: (tab: "dashboard" | "form") => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/5"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-md mx-auto px-6 flex h-16 items-center justify-around">
        <button
          onClick={() => onChange("dashboard")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-colors ${
            currentTab === "dashboard" ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="nav-dashboard"
        >
          <LayoutGrid className="w-6 h-6" strokeWidth={currentTab === "dashboard" ? 2.5 : 2} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Stock</span>
        </button>

        <div className="flex items-center justify-center flex-1">
          <button
            onClick={() => onChange("form")}
            className="flex items-center justify-center -mt-5 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            data-testid="nav-add"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1" />
      </div>
    </div>
  );
}
