"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";
import { brandColors, getThemeColor } from "@/lib/theme-config";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const isLight = resolvedTheme === "light";
  const isSystem = theme === "system";

  // Helper function to get current theme color
  const getColor = (colorKey: keyof typeof brandColors | string) => {
    if (!mounted) return brandColors.primary; // fallback while mounting
    
    if (colorKey in brandColors) {
      return brandColors[colorKey as keyof typeof brandColors];
    }
    
    // For CSS variable colors, try to get the computed value
    const currentTheme = isDark ? "dark" : "light";
    return getThemeColor(currentTheme as "light" | "dark", colorKey as any);
  };

  // Helper function to apply theme-aware classes
  const themeClass = (lightClass: string, darkClass: string) => {
    if (!mounted) return lightClass; // fallback while mounting
    return isDark ? darkClass : lightClass;
  };

  // Helper for conditional theme styling
  const themeValue = <T>(lightValue: T, darkValue: T): T => {
    if (!mounted) return lightValue; // fallback while mounting
    return isDark ? darkValue : lightValue;
  };

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark,
    isLight,
    isSystem,
    mounted,
    getColor,
    themeClass,
    themeValue,
    brandColors,
  };
}

// Hook for components that need to render differently based on theme
export function useThemeAware() {
  const { isDark, isLight, mounted, themeClass, themeValue } = useTheme();

  // Component-specific theme helpers
  const getBackgroundClass = () => themeClass("bg-white", "bg-slate-900");
  const getTextClass = () => themeClass("text-gray-900", "text-gray-100");
  const getBorderClass = () => themeClass("border-gray-200", "border-slate-700");
  const getCardClass = () => themeClass("bg-white border-gray-200", "bg-slate-800 border-slate-700");

  return {
    isDark,
    isLight,
    mounted,
    themeClass,
    themeValue,
    getBackgroundClass,
    getTextClass,
    getBorderClass,
    getCardClass,
  };
}
