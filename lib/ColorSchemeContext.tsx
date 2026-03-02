"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ColorSchemeContextValue {
  /** true = 红涨绿跌（A股习惯）；false = 绿涨红跌 */
  swapColors: boolean;
  toggleSwapColors: () => void;
  /** 上涨色 class（未交换时为绿） */
  upClass: string;
  /** 下跌色 class（未交换时为红） */
  downClass: string;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [swapColors, setSwapColors] = useState(false);
  const toggleSwapColors = useCallback(() => setSwapColors((v) => !v), []);
  const upClass = swapColors ? "text-[#ff003c]" : "text-[#00ff00]";
  const downClass = swapColors ? "text-[#00ff00]" : "text-[#ff003c]";
  return (
    <ColorSchemeContext.Provider
      value={{ swapColors, toggleSwapColors, upClass, downClass }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    return {
      swapColors: false,
      toggleSwapColors: () => {},
      upClass: "text-[#00ff00]",
      downClass: "text-[#ff003c]",
    };
  }
  return ctx;
}
