import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { ThemeName, DEFAULT_THEME, applyTheme, getStoredTheme, storeTheme } from "@/lib/themes"

interface ColorThemeContextType {
  colorTheme: ThemeName;
  setColorTheme: (theme: ThemeName) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: DEFAULT_THEME,
  setColorTheme: () => {},
});

export function useColorTheme() {
  return useContext(ColorThemeContext);
}

function ColorThemeApplicator({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  const [colorTheme, setColorThemeState] = useState<ThemeName>(getStoredTheme);

  const setColorTheme = useCallback((theme: ThemeName) => {
    setColorThemeState(theme);
    storeTheme(theme);
  }, []);

  useEffect(() => {
    const mode = resolvedTheme === "light" ? "light" : "dark";
    applyTheme(colorTheme, mode);
  }, [colorTheme, resolvedTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeApplicator>
        {children}
      </ColorThemeApplicator>
    </NextThemesProvider>
  )
}
