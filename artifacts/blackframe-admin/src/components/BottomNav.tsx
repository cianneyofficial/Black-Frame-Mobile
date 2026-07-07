import { LayoutGrid, Plus } from "lucide-react";

interface BottomNavProps {
  currentTab: "dashboard" | "form";
  onChange: (tab: "dashboard" | "form") => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-t border-white/5 pb-safe">
      <div className="max-w-md mx-auto px-4 flex h-16 items-center justify-around">
        <button
          onClick={() => onChange("dashboard")}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentTab === "dashboard" ? "text-primary" : "text-muted-foreground hover:text-white"
          }`}
        >
          <LayoutGrid className="w-6 h-6" strokeWidth={currentTab === "dashboard" ? 2.5 : 2} />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Stock</span>
        </button>

        <button
          onClick={() => onChange("form")}
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </div>
        </button>

        <div className="w-full h-full flex flex-col items-center justify-center space-y-1 text-muted-foreground opacity-50 cursor-not-allowed">
          {/* Placeholder for symmetry or future features like Settings */}
        </div>
      </div>
    </div>
  );
}
