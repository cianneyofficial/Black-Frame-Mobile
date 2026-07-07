import { useRef, useState } from "react";
import { MediaItem } from "@/hooks/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImagePlus, Link, Trash2, AlertCircle, Film, Plus } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ITEMS = 8;

function isVideoUrl(src: string): boolean {
  const lower = src.toLowerCase();
  return /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/.test(lower) || lower.includes("video");
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface MediaPickerProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

export function MediaPicker({ value, onChange }: MediaPickerProps) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (!files.length) return;

    const existing = value;
    const available = MAX_ITEMS - existing.length;

    const valid = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" dépasse 5 MB — ignoré`);
        return false;
      }
      return true;
    });

    const toProcess = valid.slice(0, available);
    if (valid.length > available) {
      toast.error(`Maximum ${MAX_ITEMS} médias par téléphone`);
    }
    if (!toProcess.length) return;

    // Fix race condition: collect all results before calling onChange once
    const results: MediaItem[] = new Array(toProcess.length);
    let completed = 0;

    toProcess.forEach((file, index) => {
      const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        results[index] = { id: generateId(), type, src, name: file.name };
        completed++;
        if (completed === toProcess.length) {
          onChange([...existing, ...results]);
        }
      };
      reader.onerror = () => {
        completed++;
        toast.error(`Erreur de lecture pour "${file.name}"`);
        if (completed === toProcess.length) {
          const valid = results.filter(Boolean);
          if (valid.length) onChange([...existing, ...valid]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = () => {
    setUrlError("");
    const trimmed = urlInput.trim();
    if (!trimmed) { setUrlError("Entrez une URL valide"); return; }
    try { new URL(trimmed); } catch { setUrlError("URL invalide"); return; }
    if (value.length >= MAX_ITEMS) { toast.error(`Maximum ${MAX_ITEMS} médias`); return; }
    const type: "image" | "video" = isVideoUrl(trimmed) ? "video" : "image";
    onChange([...value, { id: generateId(), type, src: trimmed, name: trimmed }]);
    setUrlInput("");
  };

  const removeItem = (id: string) => onChange(value.filter(m => m.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["file", "url"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors border ${
              tab === t
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-white/5 border-white/10 text-muted-foreground"
            }`}
            data-testid={`media-tab-${t}`}
          >
            {t === "file" ? <ImagePlus className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            {t === "file" ? "Importer" : "Lien URL"}
          </button>
        ))}
      </div>

      {/* File upload */}
      {tab === "file" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            data-testid="media-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors active:scale-[0.98]"
            data-testid="media-upload-button"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium">Choisir photos / vidéos (max 5 MB)</span>
          </button>
        </>
      )}

      {/* URL input */}
      {tab === "url" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://exemple.com/photo.jpg"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(""); }}
              className="flex-1 h-12 bg-white/5 border-white/10 text-sm"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
              data-testid="media-url-input"
            />
            <Button
              type="button"
              onClick={handleAddUrl}
              className="h-12 px-4 shrink-0"
              data-testid="media-url-add"
            >
              Ajouter
            </Button>
          </div>
          {urlError && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {urlError}
            </div>
          )}
        </div>
      )}

      {/* Media list */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {value.length} / {MAX_ITEMS} médias
          </p>
          <div className="flex flex-col gap-2">
            {value.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2"
                data-testid={`media-item-${item.id}`}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                  {item.type === "image" ? (
                    <img
                      src={item.src}
                      alt={item.name ?? `Média ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/60">
                      <Film className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-white/80">
                    {item.name ? item.name.split("/").pop() : `Média ${i + 1}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                    {item.type === "video" ? "Vidéo" : "Image"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  data-testid={`media-remove-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
