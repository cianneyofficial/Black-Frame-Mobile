import { useRef, useState } from "react";
import { Download, FileJson, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createBackupPayload,
  parseBackupText,
  restoreBackupPayload,
  serializeBackupPayload,
  type BackupPayload,
  type BackupValidationResult,
} from "@/lib/migration";

function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([serializeBackupPayload(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `black-frame-mobile-backup-${payload.exportedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DataBackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupValidationResult | null>(null);

  const handleExport = () => {
    try {
      const payload = createBackupPayload();
      downloadBackup(payload);
      toast.success(`${payload.phones.length} téléphone(s) sauvegardé(s)`);
    } catch {
      toast.error("Impossible de créer la sauvegarde locale");
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const result = parseBackupText(await file.text());
    setPending(result);
  };

  const handleRestore = () => {
    if (!pending?.success || !pending.payload) return;
    try {
      restoreBackupPayload(pending.payload);
      setPending(null);
      toast.success("Sauvegarde restaurée. Rechargez la page pour actualiser les données.");
    } catch {
      toast.error("La restauration a échoué — aucune donnée n'a été remplacée");
    }
  };

  const report = pending?.report;
  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Sauvegarde Phase A</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Exportez l&apos;inventaire et le taux de change sans supprimer les données du navigateur.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={handleExport} className="h-10 border-white/10 bg-transparent text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exporter JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-10 border-white/10 bg-transparent text-xs">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Restaurer JSON
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Dialog open={pending !== null} onOpenChange={open => !open && setPending(null)}>
        <DialogContent className="w-[92vw] max-w-sm rounded-2xl border-white/10 bg-[#141416]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary" />
              Aperçu de la restauration
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Les données actuelles ne seront remplacées qu&apos;après votre confirmation.
            </DialogDescription>
          </DialogHeader>

          {pending && (
            <div className="space-y-3 text-sm">
              {pending.errors.length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  {pending.errors.map(error => <p key={error}>{error}</p>)}
                </div>
              )}
              {report && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <ReportItem label="Total" value={report.total} />
                  <ReportItem label="Valides" value={report.valid} />
                  <ReportItem label="Invalides" value={report.invalid} />
                  <ReportItem label="Doublons" value={report.duplicateCount} />
                </div>
              )}
              {pending.payload && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
                  <p>Version du format : {pending.payload.version}</p>
                  <p>Taux : {pending.payload.exchangeRate.toLocaleString("fr-FR")} CDF/USD</p>
                  <p>Export : {new Date(pending.payload.exportedAt).toLocaleString("fr-FR")}</p>
                </div>
              )}
              {report && report.errors.length > 0 && (
                <div className="max-h-32 overflow-auto rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  {report.errors.slice(0, 20).map((error, index) => (
                    <p key={`${error.index}-${error.path}-${index}`}>
                      Téléphone {error.index + 1} · {error.path} : {error.message}
                    </p>
                  ))}
                  {report.errors.length > 20 && <p>… autres erreurs non affichées</p>}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setPending(null)} className="border-white/10 bg-transparent">
              Annuler
            </Button>
            <Button type="button" disabled={!pending?.success} onClick={handleRestore}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Confirmer la restauration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-bold text-white">{value}</p>
    </div>
  );
}