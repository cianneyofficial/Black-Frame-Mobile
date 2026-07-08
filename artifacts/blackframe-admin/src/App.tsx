import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { usePhones } from "@/hooks/use-phones";
import { Dashboard } from "@/components/Dashboard";
import { PhoneForm, FormSubmitData } from "@/components/PhoneForm";
import { BottomNav } from "@/components/BottomNav";
import { Phone } from "@/hooks/types";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

// ── Auth guard — runs before first render ─────────────────────────────────────
// Rule: admin lives at /dashboard.html. / is ALWAYS the public site.
const isLoggedIn = localStorage.getItem("admin_logged") === "true";
if (!isLoggedIn) {
  // Not authenticated → public site
  window.location.replace("/index.html");
} else if (
  window.location.pathname === "/" ||
  window.location.pathname === ""
) {
  // Authenticated but landed on / → normalize to /dashboard.html
  window.location.replace("/dashboard.html");
}

function App() {
  const { phones, addPhone, updatePhone, deletePhone, markAsSold } = usePhones();
  const [tab, setTab] = useState<"dashboard" | "form">("dashboard");
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Don't render while redirecting (not logged in, or normalizing URL to /dashboard.html)
  const atRoot =
    window.location.pathname === "/" || window.location.pathname === "";
  if (!isLoggedIn || atRoot) return null;

  const handleEdit = (phone: Phone) => {
    setEditingPhone(phone);
    setTab("form");
  };

  const handleAddSubmit = (data: FormSubmitData) => {
    if (editingPhone) {
      updatePhone(editingPhone.id, data);
    } else {
      addPhone(data);
    }
    setEditingPhone(null);
    setTab("dashboard");
  };

  const handleCancel = () => {
    setEditingPhone(null);
    setTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_logged");
    window.location.replace("/admin.html");
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative selection:bg-primary/30">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 w-full">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex flex-col items-start">
            <h1 className="text-lg font-black tracking-tight leading-none">BLACK FRAME</h1>
            <span className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold mt-0.5">
              Mobile Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {tab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                phones={phones}
                onEdit={handleEdit}
                onDelete={deletePhone}
                onMarkSold={markAsSold}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <PhoneForm
                initialData={editingPhone}
                onSubmit={handleAddSubmit}
                onCancel={handleCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav currentTab={tab} onChange={(t) => {
        if (t === "form") setEditingPhone(null);
        setTab(t);
      }} />

      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

export default App;
