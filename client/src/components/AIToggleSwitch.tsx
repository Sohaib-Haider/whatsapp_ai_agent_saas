import { useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

interface AIToggleSwitchProps {
  isEnabled: boolean;
  isLoading?: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
}

/**
 * Elegant AI toggle switch component
 * Prominent placement with visual feedback
 */
export default function AIToggleSwitch({
  isEnabled,
  isLoading = false,
  onToggle,
}: AIToggleSwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = async () => {
    if (isLoading || isAnimating) return;

    setIsAnimating(true);
    try {
      await onToggle(!isEnabled);
      toast.success(`AI ${!isEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error("Failed to toggle AI");
      console.error(error);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || isAnimating}
      className={`relative inline-flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isEnabled
          ? "bg-green-600 text-white focus:ring-green-600"
          : "bg-slate-200 text-slate-700 focus:ring-slate-400"
      }`}
    >
      {/* Icon */}
      <div className="relative">
        <Zap
          className={`w-5 h-5 transition-transform duration-300 ${
            isEnabled ? "scale-100 rotate-0" : "scale-100 rotate-180"
          }`}
        />
        {isEnabled && (
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
        )}
      </div>

      {/* Label */}
      <span className="text-sm font-semibold">
        {isLoading || isAnimating ? "Updating..." : isEnabled ? "AI Active" : "AI Inactive"}
      </span>

      {/* Visual indicator dot */}
      <div
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
          isEnabled ? "bg-white" : "bg-slate-400"
        }`}
      />
    </button>
  );
}
