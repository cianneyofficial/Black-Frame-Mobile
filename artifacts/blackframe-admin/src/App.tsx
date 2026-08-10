import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { usePhones } from "@/hooks/use-phones";
import { Dashboard } from "@/components/Dashboard";
import { PhoneForm, FormSubmitData } from "@/components/PhoneForm";
import { SalesHistory } from "@/components/SalesHistory";
import { BottomNav, AdminTab } from "@/components/BottomNav";
import { Phone } from "@/hooks/types";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
import { CurrencyProvider, useCurrency, DEFAULT_RATE, RATE_KEY } from "@/contexts/currency-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataBackupPanel } from "@/components/DataBackupPanel";

// ── Auth guard — runs before first render ─────────────────────────────────────
const isLoggedIn = localStorage.getItem("admin_logged") === "true";
if (!isLoggedIn) {
  window.location.replace("/index.html");
} else if (window.location.pathname === "/" || window.location.pathname === "") {
  window.location.replace("/dashboard.html");
}

function AdminApp() {
  const { phones, addPhone, updatePhone, deletePhone, markAsSold } = usePhones();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { rate, updateRate } = useCurrency();
  const [rateInput, setRateInput] = useState(String(rate));

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    setRateInput(String(rate));
  }, [rate]);

  const atRoot = window.location.pathname === "/" || window.location.pathname === "";
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

  const handleSaveRate = () => {
    const r = Number(rateInput);
    if (!isNaN(r) && r > 0) {
      updateRate(r);
      setShowSettings(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 w-full">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex flex-col items-start">
            <h1 className="text-lg font-black tracking-tight leading-none">BLACK FRAME</h1>
            <span className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold mt-0.5">
              Mobile Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-2.5 py-2 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20"
              title="Paramètres"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1&nbsp;$&nbsp;=&nbsp;{Number(rate).toLocaleString("fr-FR")}&nbsp;CDF</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-400 transition-colors px-2.5 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="w-[90vw] max-w-sm rounded-2xl bg-[#141416] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Taux de change
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Définissez le taux utilisé pour convertir CDF en dollars.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <DataBackupPanel />
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                1 USD = ? CDF
              </label>
              <Input
                type="number"
                inputMode="numeric"
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-base font-bold text-primary focus-visible:ring-primary"
                placeholder="Ex: 2500"
              />
              <p className="text-[11px] text-muted-foreground">
                Taux actuel : 1 $ = {Number(rate).toLocaleString("fr-FR")} CDF
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveRate}
                className="flex-1 h-11 font-bold"
              >
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={() => { setRateInput(String(DEFAULT_RATE)); updateRate(DEFAULT_RATE); setShowSettings(false); }}
                className="h-11 border-white/10 bg-transparent text-white hover:bg-white/5"
              >
                Reset ({DEFAULT_RATE})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {tab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <Dashboard
                phones={phones}
                onEdit={handleEdit}
                onDelete={deletePhone}
                onMarkSold={markAsSold}
              />
            </motion.div>
          )}

          {tab === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              <PhoneForm
                initialData={editingPhone}
                onSubmit={handleAddSubmit}
                onCancel={handleCancel}
              />
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              <SalesHistory phones={phones} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav
        currentTab={tab}
        onChange={t => {
          if (t !== "form") setEditingPhone(null);
          setTab(t);
        }}
      />

      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

function App() {
  return (
    <CurrencyProvider>
      <AdminApp />
    </CurrencyProvider>
  );
}

export default App;
