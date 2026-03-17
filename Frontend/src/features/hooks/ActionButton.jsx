export default function ActionButton({
  onClick,
  icon,
  label,
  disabled = false,
  color = "gray",
}) {
  const base =
    "border transition-all rounded-xl flex items-center justify-center";

  const colors = {
    gray: "bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-green-500",
    blue: "bg-blue-700 hover:bg-blue-600",
    green: "bg-green-700 hover:bg-green-600",
    purple: "bg-purple-700 hover:bg-purple-600",
  };

  return (
    <>
      {/* Desktop */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${colors[color]} text-xs px-3 py-1.5 font-medium gap-1 hidden sm:flex`}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>

      {/* Mobile */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${colors[color]} text-sm w-8 h-8 sm:hidden`}
      >
        {icon}
      </button>
    </>
  );
}
