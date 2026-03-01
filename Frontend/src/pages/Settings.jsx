import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

const TABS = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "editor", label: "Editor", icon: "🖊️" },
  { id: "account", label: "Account", icon: "🔐" },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar user={user} onSignOut={logout} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your account and editor preferences
          </p>
        </div>
        <div className="flex gap-6 animate-in fade-in duration-500">
          <aside className="w-44 shrink-0">
            <nav className="flex flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-150 font-medium ${
                    activeTab === tab.id
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "text-gray-500 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "editor" && <EditorTab />}
            {activeTab === "account" && (
              <AccountTab logout={logout} navigate={navigate} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileTab({ user }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const { refreshUser } = useAuth();

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/profile/user", { name, email });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Profile"
      description="Update your display name and email address."
    >
      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Avatar">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-2xl font-bold text-green-400">
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <p className="text-xs text-gray-500">
            Avatar is auto-generated from your name initial.
          </p>
        </div>
      </Field>
      <SaveButton loading={saving} onClick={handleSave} />
    </Section>
  );
}

function EditorTab() {
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [ligatures, setLigatures] = useState(true);
  const [theme, setTheme] = useState("vs-dark");
  const [font, setFont] = useState("Fira Code");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("editorPrefs");
    if (saved) {
      const p = JSON.parse(saved);
      setFontSize(p.fontSize ?? 14);
      setTabSize(p.tabSize ?? 2);
      setWordWrap(p.wordWrap ?? true);
      setMinimap(p.minimap ?? false);
      setLigatures(p.ligatures ?? true);
      setTheme(p.theme ?? "vs-dark");
      setFont(p.font ?? "Fira Code");
    }
  }, []);

  const FONTS = [
    "Fira Code",
    "JetBrains Mono",
    "Source Code Pro",
    "Cascadia Code",
    "Inconsolata",
    "IBM Plex Mono",
    "Hack",
    "Ubuntu Mono",
    "Courier New",
    "Consolas",
    "Monaco",
    "Inter",
    "Poppins",
    "Roboto",
    "Montserrat",
    "Open Sans",
    "Lato",
    "Nunito",
    "Work Sans",
    "Playfair Display",
    "Merriweather",
    "Cormorant",
    "Cinzel",
    "Libre Baskerville",
    "Pacifico",
    "Dancing Script",
    "Great Vibes",
    "Satisfy",
    "Sacramento",
    "Caveat",
    "Kaushan Script",
    "Orbitron",
    "Audiowide",
    "Exo 2",
    "Rajdhani",
    "Bebas Neue",
    "Arial",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "Trebuchet MS",
  ];

  const THEMES = [
    {
      value: "vs-dark",
      label: "VS Dark",
      bg: "#1e1e1e",
      sidebar: "#252526",
      accent: "#4ec9b0",
    },
    {
      value: "light",
      label: "VS Light",
      bg: "#ffffff",
      sidebar: "#f3f3f3",
      accent: "#007acc",
    },
    {
      value: "hc-black",
      label: "High Contrast",
      bg: "#000000",
      sidebar: "#0a0a0a",
      accent: "#ffffff",
    },
    {
      value: "Dracula",
      label: "Dracula",
      bg: "#282a36",
      sidebar: "#21222c",
      accent: "#ff79c6",
    },
    {
      value: "Monokai",
      label: "Monokai",
      bg: "#272822",
      sidebar: "#1e1f1c",
      accent: "#a6e22e",
    },
    {
      value: "Nord",
      label: "Nord",
      bg: "#2e3440",
      sidebar: "#3b4252",
      accent: "#88c0d0",
    },
    {
      value: "Twilight",
      label: "Twilight",
      bg: "#141414",
      sidebar: "#0d0d0d",
      accent: "#cda869",
    },
    {
      value: "Merbivore",
      label: "Merbivore",
      bg: "#161616",
      sidebar: "#0d0d0d",
      accent: "#ff6600",
    },
    {
      value: "Blackboard",
      label: "Blackboard",
      bg: "#0c1021",
      sidebar: "#080c18",
      accent: "#fbde2d",
    },
    {
      value: "Sunburst",
      label: "Sunburst",
      bg: "#0d0d0d",
      sidebar: "#080808",
      accent: "#e9c062",
    },
    {
      value: "Cobalt",
      label: "Cobalt",
      bg: "#002240",
      sidebar: "#001f3a",
      accent: "#ff9d00",
    },
    {
      value: "SpaceCadet",
      label: "Space Cadet",
      bg: "#0d0e1b",
      sidebar: "#080910",
      accent: "#9aa3d6",
    },
    {
      value: "idleFingers",
      label: "idleFingers",
      bg: "#323232",
      sidebar: "#292929",
      accent: "#6eb13f",
    },
    {
      value: "krTheme",
      label: "krTheme",
      bg: "#140d0e",
      sidebar: "#0d0709",
      accent: "#963b3b",
    },
    {
      value: "monoindustrial",
      label: "monoindustrial",
      bg: "#222222",
      sidebar: "#191919",
      accent: "#82b414",
    },
    {
      value: "Amy",
      label: "Amy",
      bg: "#200020",
      sidebar: "#180018",
      accent: "#cc99ff",
    },
    {
      value: "Tomorrow",
      label: "Tomorrow",
      bg: "#ffffff",
      sidebar: "#f5f5f5",
      accent: "#4d94ff",
    },
    {
      value: "GitHub",
      label: "GitHub",
      bg: "#ffffff",
      sidebar: "#f5f5f5",
      accent: "#0366d6",
    },
    {
      value: "Clouds",
      label: "Clouds",
      bg: "#f8f8f8",
      sidebar: "#efefef",
      accent: "#5b3c8c",
    },
    {
      value: "Dawn",
      label: "Dawn",
      bg: "#f5f2f2",
      sidebar: "#ede9e9",
      accent: "#6a5acd",
    },
    {
      value: "Dreamweaver",
      label: "Dreamweaver",
      bg: "#ffffff",
      sidebar: "#f5f5f5",
      accent: "#0000cc",
    },
    {
      value: "iPlastic",
      label: "iPlastic",
      bg: "#f7f7f7",
      sidebar: "#eeeeee",
      accent: "#6c71c4",
    },
    {
      value: "Textmate",
      label: "Textmate",
      bg: "#ffffff",
      sidebar: "#f5f5f5",
      accent: "#8f0005",
    },
    {
      value: "Active4D",
      label: "Active4D",
      bg: "#e7e5cc",
      sidebar: "#dddbc0",
      accent: "#0066ff",
    },
    {
      value: "Eiffel",
      label: "Eiffel",
      bg: "#ffffff",
      sidebar: "#f5f5f5",
      accent: "#4488ff",
    },
    {
      value: "IDLE",
      label: "IDLE",
      bg: "#ffffff",
      sidebar: "#f5f5f5",
      accent: "#ff7700",
    },
    {
      value: "Katzenmilch",
      label: "Katzenmilch",
      bg: "#f5f5f5",
      sidebar: "#ececec",
      accent: "#7a6e56",
    },
    {
      value: "LAZY",
      label: "LAZY",
      bg: "#ffffec",
      sidebar: "#fffff0",
      accent: "#336699",
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(
        "editorPrefs",
        JSON.stringify({
          fontSize,
          tabSize,
          wordWrap,
          minimap,
          ligatures,
          theme,
          font,
        }),
      );
      toast.success("Editor preferences saved!");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Editor" description="Customize your coding environment.">
      <Field label="Color Theme">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`relative h-20 rounded-2xl border transition-all duration-300 flex flex-col justify-between p-3 text-left hover:scale-105 active:scale-95 ${
                theme === t.value
                  ? "border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(74,222,128,0.25)]"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
              }`}
            >
              {/* Mini preview */}
              <div
                className="w-full h-8 rounded-lg overflow-hidden flex border border-black/20"
                style={{ background: t.bg }}
              >
                <div className="w-3" style={{ background: t.sidebar }} />
                <div className="flex-1 p-1.5 space-y-1">
                  <div
                    className="h-1.5 w-2/3 rounded"
                    style={{ background: t.accent }}
                  />
                  <div className="h-1.5 w-1/2 bg-white/20 rounded" />
                  <div className="h-1.5 w-3/4 bg-white/10 rounded" />
                </div>
              </div>
              <span
                className={`text-xs font-medium truncate ${theme === t.value ? "text-green-400" : "text-gray-300"}`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Font Family">
        <Select value={font} onChange={(e) => setFont(e.target.value)}>
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={`Font Size: ${fontSize}px`}>
          <input
            type="range"
            min={11}
            max={30}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-green-400 cursor-pointer"
          />
        </Field>
        <Field label={`Tab Size: ${tabSize}`}>
          <input
            type="range"
            min={2}
            max={8}
            step={2}
            value={tabSize}
            onChange={(e) => setTabSize(Number(e.target.value))}
            className="w-full accent-green-400 cursor-pointer"
          />
        </Field>
      </div>

      <Field label="Options">
        <div className="flex flex-col gap-3">
          <Toggle label="Word Wrap" checked={wordWrap} onChange={setWordWrap} />
          <Toggle label="Minimap" checked={minimap} onChange={setMinimap} />
          <Toggle
            label="Font Ligatures"
            checked={ligatures}
            onChange={setLigatures}
          />
        </div>
      </Field>

      <SaveButton loading={saving} onClick={handleSave} />
    </Section>
  );
}

function AccountTab({ logout, navigate }) {
  const { forgetPassword, user } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPwSaving(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      toast.success("Password changed!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await forgetPassword(user?.email);
      toast.success("Reset link sent to your email!");
    } catch {
      toast.error("Failed to send reset link");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      await logout();
      navigate("/login");
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Change Password"
        description="Update your password regularly to keep your account secure."
      >
        <Field label="Current Password">
          <Input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="New Password">
          <Input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <div className="flex items-center gap-3">
          <SaveButton
            label="Update Password"
            loading={pwSaving}
            onClick={handleChangePassword}
          />
          <button
            onClick={handleForgotPassword}
            className="text-xs text-gray-500 hover:text-green-400 transition-colors"
          >
            Forgot current password?
          </button>
        </div>
      </Section>

      <Section
        title="Danger Zone"
        description="Permanent and irreversible actions."
        danger
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white font-medium">Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently deletes your account and all sessions. This cannot be
              undone.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            onBlur={() => setConfirmDel(false)}
            className={`shrink-0 text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
              confirmDel
                ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
            }`}
          >
            {deleting
              ? "Deleting…"
              : confirmDel
                ? "Confirm Delete"
                : "Delete Account"}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, description, danger = false, children }) {
  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        danger
          ? "border-red-500/20 bg-red-500/5"
          : "border-gray-800/60 bg-gray-900/40"
      }`}
    >
      <div>
        <h3
          className={`font-semibold text-sm ${danger ? "text-red-400" : "text-white"}`}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-800/80 border border-gray-700/60 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 placeholder-gray-600 transition-all duration-200"
    />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-gray-800/80 border border-gray-700/60 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 transition-all duration-200"
    >
      {children}
    </select>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${checked ? "bg-green-500" : "bg-gray-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </label>
  );
}

function SaveButton({ label = "Save Changes", loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="self-start flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-[0_0_16px_rgba(74,222,128,0.35)] hover:scale-105 active:scale-95"
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      )}
      {label}
    </button>
  );
}
