"use client";

import React, { useState, useRef } from "react";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { uploadCreativeAsset } from "@/lib/firebase/storage";
import { ChallengeType } from "@/lib/firebase/schema";
import { ImageIcon, UploadCloud, X, RefreshCw, FileText, User, Sparkles, AlertCircle } from "lucide-react";

interface CreativeWorkspaceProps {
  eventId: string;
  teamId: string;
  roundId: string;
  challengeType: ChallengeType;
  imageUrl?: string;
  fileName?: string;
  creativeText?: string;
  onImageChange: (imageUrl: string, fileName: string) => void;
  onTextChange: (text: string) => void;
  isMyRole: boolean;
  member2Name?: string;
  readOnly?: boolean;
}

export function CreativeWorkspace({
  eventId,
  teamId,
  roundId,
  challengeType,
  imageUrl,
  fileName,
  creativeText = "",
  onImageChange,
  onTextChange,
  isMyRole,
  member2Name,
  readOnly = false,
}: CreativeWorkspaceProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageRequired = challengeType === "IMAGE" || challengeType === "COMBINED";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || readOnly) return;
    await processUpload(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (readOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const processUpload = async (file: File) => {
    setUploadError("");
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadCreativeAsset(
        eventId,
        teamId,
        roundId,
        file,
        (percent) => setProgress(percent)
      );
      onImageChange(result.downloadUrl, result.fileName);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setUploadError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    if (readOnly) return;
    onImageChange("", "");
  };

  return (
    <APBCard className={`p-5 space-y-4 border-[var(--color-apb-surface-border)] ${isMyRole ? "ring-1 ring-purple-500/30 bg-[var(--color-apb-surface)]" : "bg-[var(--color-apb-surface)]/50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-apb-surface-border)] pb-3">
        <div className="flex items-center gap-2">
          {isImageRequired ? (
            <ImageIcon className="w-4 h-4 text-purple-400" />
          ) : (
            <FileText className="w-4 h-4 text-purple-400" />
          )}
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
            Member 02 — {isImageRequired ? "Creative / Asset Workspace" : "Secondary Creative Workspace"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {member2Name && (
            <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
              ({member2Name})
            </span>
          )}
          <Badge
            variant="outline"
            className={`font-mono text-xs uppercase ${
              isMyRole
                ? "bg-purple-500/15 border-purple-500 text-purple-400 font-bold"
                : "bg-white/5 text-muted-foreground"
            }`}
          >
            <User className="w-3 h-3 mr-1" />
            {isMyRole ? "Your Workspace" : "Partner Editing"}
          </Badge>
        </div>
      </div>

      {/* Workspace Content Based on Challenge Type */}
      {isImageRequired && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Generated Image / Creative Asset
              </span>
              {fileName && (
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                  ({fileName})
                </span>
              )}
            </div>
            {imageUrl && !readOnly && (
              <APBButton
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="h-7 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Remove Image
              </APBButton>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            disabled={readOnly || uploading}
          />

          {uploadError && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Image Preview or Drop Zone */}
          {imageUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-[var(--color-apb-surface-border)] bg-black/60 aspect-video max-h-72 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Creative response"
                className="w-full h-full object-contain"
              />
              {!readOnly && (
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <APBButton
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="font-mono text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Replace
                  </APBButton>
                  <APBButton
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="font-mono text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" /> Remove
                  </APBButton>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !readOnly && !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-[var(--color-apb-surface-border)] rounded-lg p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                readOnly
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-purple-400/50 hover:bg-white/[0.02] cursor-pointer"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {readOnly ? "Image uploads closed" : "Click to upload or drag & drop"}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  PNG, JPEG, WEBP, or SVG (Max 10MB)
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span className="text-purple-400">Uploading creative asset...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-purple-950" />
            </div>
          )}
        </div>
      )}

      {/* Accompanying Creative Notes / Textarea */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-apb-surface-border)]/50">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>{isImageRequired ? "Creative Notes / Synthesis" : "Creative Response / Reasoning"}</span>
        </label>
        <textarea
          value={creativeText}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={readOnly}
          placeholder={
            readOnly
              ? "Locked."
              : isMyRole
              ? isImageRequired
                ? "Add notes about your generation parameters, model choices, or artistic rationale..."
                : "Provide your secondary creative response, negative prompt, or parameters here..."
              : "Member 2 is editing creative response..."
          }
          rows={isImageRequired ? 3 : 8}
          className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md p-3 font-mono text-sm text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
    </APBCard>
  );
}
