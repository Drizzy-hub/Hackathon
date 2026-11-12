"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
  previewUrl: string | null;
}

export default function ImageUploader({ onImageSelected, disabled, previewUrl }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {
      setError("Camera preview could not auto-play. Tap the video to start it.");
    });
  }, [cameraActive]);

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return `Unsupported file type (${file.type || "unknown"}).`;
    if (file.size > MAX_BYTES) return `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 10 MB.`;
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onImageSelected(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setError("Unable to access camera. Check browser permissions.");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFile(file);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`see-lift relative overflow-hidden rounded-feature border-2 border-dashed p-8 text-center transition-all duration-base ${
          dragOver
            ? "border-forest bg-gradient-to-br from-sage/60 via-cream to-amber-soft/40 see-glow"
            : "border-line-strong bg-gradient-to-br from-surface via-ivory to-cream/40 hover:border-forest/40"
        }`}
      >
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected image preview"
              className="see-fade-in max-h-72 rounded-card object-contain shadow-[0_18px_40px_-20px_rgba(24,61,53,0.4)]"
            />
            <p className="text-sm text-muted">
              <span aria-hidden>✦ </span>Image ready. Upload another to replace it.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage/70 text-xl text-forest">
              <span aria-hidden>↑</span>
            </div>
            <p className="text-lg font-semibold text-ink">
              Drop an image, choose a file, or use your camera.
            </p>
            <p className="text-xs text-muted">PNG, JPEG, WEBP or GIF · up to 10 MB</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="min-h-[44px] rounded-input bg-forest px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Choose file
          </button>

          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={disabled}
              className="min-h-[44px] rounded-input border border-line-strong bg-surface px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-forest hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50"
            >
              📷 Use camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="min-h-[44px] rounded-input border border-coral bg-coral/10 px-5 py-2 text-sm font-semibold text-coral transition hover:bg-coral/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              Stop camera
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="sr-only"
          onChange={handleInputChange}
          aria-label="Choose image file"
        />
      </div>

      {cameraActive && (
        <div className="see-fade-in space-y-3 rounded-feature border border-line-strong bg-surface p-4 shadow-card">
          <div className="relative overflow-hidden rounded-card bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label="Live camera preview"
              className="w-full max-h-72 object-cover"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <span className="see-stage-dot inline-block h-2 w-2 rounded-full bg-coral" aria-hidden />
              LIVE
            </span>
          </div>
          <button
            type="button"
            onClick={capture}
            className="w-full min-h-[48px] rounded-input bg-forest px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            📸 Capture frame
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <span aria-hidden>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
