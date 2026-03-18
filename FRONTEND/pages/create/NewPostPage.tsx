import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Settings, Camera } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * New post page (from camera or local storage) – same for all accounts.
 * X, "New post", Next. Recents, Select. Gallery grid with camera tile; multi-select → Edit.
 */
export default function NewPostPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const openFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setFiles((prev) => [...prev, ...list].slice(0, 10));
    e.target.value = '';
  };

  const goToEdit = () => {
    if (files.length) navigate('/create/post/edit', { state: { files } });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-base">New post</span>
          <button
            type="button"
            onClick={goToEdit}
            disabled={!files.length}
            className="text-[#0095f6] font-semibold text-sm disabled:opacity-50 disabled:text-[#737373]"
          >
            Next
          </button>
        </header>

        <div className="flex-1 flex flex-col p-4 pb-20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#a8a8a8] text-sm">Recents</span>
            <button type="button" className="text-[#0095f6] text-sm font-medium">
              Select
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 flex-1 content-start">
            <button
              type="button"
              onClick={openFile}
              className="aspect-square rounded-lg bg-[#262626] border border-[#363636] border-dashed flex flex-col items-center justify-center gap-2"
            >
              <Camera className="w-10 h-10 text-[#737373]" />
              <ThemedText secondary className="text-xs">Camera</ThemedText>
            </button>
            <button
              type="button"
              onClick={openFile}
              className="aspect-square rounded-lg bg-[#262626] border border-[#363636] border-dashed flex flex-col items-center justify-center gap-2"
            >
              <ThemedText secondary className="text-2xl">+</ThemedText>
              <ThemedText secondary className="text-xs">Gallery</ThemedText>
            </button>
            {files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-[#262626]">
                {file.type.startsWith('video/') ? (
                  <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </MobileShell>
    </ThemedView>
  );
}
