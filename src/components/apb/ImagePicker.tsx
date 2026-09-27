
"use client";

import React, { useState, useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { app } from "@/lib/firebase/config";
import { Loader2, UploadCloud, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { APBButton } from "./APBButton";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const storage = getStorage(app);
      const listRef = ref(storage, "display");
      const res = await listAll(listRef);
      const urls = await Promise.all(res.items.map(itemRef => getDownloadURL(itemRef)));
      setImages(urls);
    } catch (e) {
      console.error("Failed to load images", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `display/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setImages(prev => [url, ...prev]);
      onChange(url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      <div className="relative border-2 border-dashed border-[var(--color-apb-surface-border)] hover:border-[var(--color-apb-cyan)]/50 rounded-lg p-6 flex flex-col items-center justify-center transition-colors bg-black/20 group">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[var(--color-apb-cyan)] animate-spin" />
            <span className="text-xs font-mono text-[var(--color-apb-cyan)]">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
            <UploadCloud className="w-6 h-6" />
            <span className="text-xs font-mono uppercase tracking-widest">Click or Drag to Upload</span>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="bg-black/40 rounded-lg p-3 border border-white/5">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex justify-between items-center">
          <span>Media Library</span>
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
        
        {images.length === 0 && !loading ? (
          <div className="text-center py-4 text-xs font-mono text-slate-500">No images found.</div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            {images.map((url, i) => {
              const isSelected = value === url;
              return (
                <div
                  key={i}
                  onClick={() => onChange(url)}
                  className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all snap-start ${
                    isSelected ? "border-[var(--color-apb-cyan)] scale-100" : "border-transparent opacity-60 hover:opacity-100 scale-95"
                  }`}
                >
                  <img src={url} alt="Gallery" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[var(--color-apb-cyan)]/20 flex items-center justify-center backdrop-blur-[1px]">
                      <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Value */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-slate-500 shrink-0">Selected:</span>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="No image selected"
          className="flex-1 bg-transparent border-b border-slate-700 focus:border-[var(--color-apb-cyan)] outline-none text-white truncate"
        />
        {value && (
          <APBButton variant="ghost" size="sm" onClick={() => onChange("")} className="h-6 text-[10px] text-rose-400">Clear</APBButton>
        )}
      </div>
    </div>
  );
}

