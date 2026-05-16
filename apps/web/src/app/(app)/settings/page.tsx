import { User, Moon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and workspace.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "appearance", label: "Appearance", icon: Moon },
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
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Profile</h2>
            
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary p-1">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-900">
                    A
                  </div>
                </div>
                <div>
                  <button className="btn-secondary text-sm">Change Avatar</button>
                  <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" className="input-glass" defaultValue="Alex" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" className="input-glass" defaultValue="Developer" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" className="input-glass text-gray-500" defaultValue="alex@noteflow.app" disabled />
                <p className="text-xs text-gray-500">Your email address is used for logging in.</p>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button className="btn-secondary">Cancel</button>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
