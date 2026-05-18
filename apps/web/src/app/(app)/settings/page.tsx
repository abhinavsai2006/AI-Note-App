"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, Upload, User } from "lucide-react";
import { getSession, updateSessionName } from "@/lib/localAuth";
import { getStoredAvatar, setStoredAvatar } from "@/lib/localProfile";

function splitName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export default function SettingsPage() {
  const session = getSession();
  const initialName = splitName(session?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => getStoredAvatar());
  const [firstName, setFirstName] = useState(initialName.firstName || "");
  const [lastName, setLastName] = useState(initialName.lastName || "");
  const [email, setEmail] = useState(session?.email || "");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const session = getSession();
      const nameParts = splitName(session?.name || "");
      setFirstName(nameParts.firstName || "");
      setLastName(nameParts.lastName || "");
      setEmail(session?.email || "");
      setAvatarUrl(getStoredAvatar());
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    updateSessionName(displayName);
    setStoredAvatar(avatarUrl);
    setStatus("Profile updated successfully.");
  };

  const handleCancel = () => {
    const session = getSession();
    const nameParts = splitName(session?.name || "");
    setFirstName(nameParts.firstName || "");
    setLastName(nameParts.lastName || "");
    setEmail(session?.email || "");
    setAvatarUrl(getStoredAvatar());
    setStatus(null);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50/60">
      <header className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and workspace.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {[
            { id: "profile", label: "Profile", icon: User },
          ].map((item, idx) => (
            <button 
              key={item.id} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-75 ${
                idx === 0 
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
              }`}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <form className="glass-card p-6 md:p-8" onSubmit={handleSave}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Profile</h2>
            
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar preview" fill className="rounded-full object-cover bg-white p-0.5" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-900">
                      {(firstName?.charAt(0) || email.charAt(0)).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <label className="btn-secondary text-sm inline-flex items-center gap-2 cursor-pointer">
                    <Upload size={14} /> Change Avatar
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" className="input-glass" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" className="input-glass" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" className="input-glass text-gray-500" value={email} disabled />
                <p className="text-xs text-gray-500">Your email address is used for logging in.</p>
              </div>

              {status && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={16} /> {status}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
