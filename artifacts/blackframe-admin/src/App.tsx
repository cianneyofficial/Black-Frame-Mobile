import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { usePhones } from "@/hooks/use-phones";
import { Dashboard } from "@/components/Dashboard";
import { PhoneForm } from "@/components/PhoneForm";
import { BottomNav } from "@/components/BottomNav";
import { Phone } from "@/hooks/types";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const { phones, addPhone, updatePhone, deletePhone, markAsSold } = usePhones();
  const [tab, setTab] = useState<"dashboard" | "form">("dashboard");
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleEdit = (phone: Phone) => {
    setEditingPhone(phone);
    setTab("form");
  };

  const handleAddSubmit = (data: Omit<Phone, "id">) => {
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

  const handleMarkSold = (id: string) => {
    markAsSold(id);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative selection:bg-primary/30">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 w-full flex flex-col items-center justify-center">
        <h1 className="text-xl font-black tracking-tight leading-none">BLACK FRAME</h1>
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mt-1">Mobile Admin</span>
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
                onMarkSold={handleMarkSold}
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
