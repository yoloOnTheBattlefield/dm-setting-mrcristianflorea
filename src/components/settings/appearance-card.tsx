import { useTheme } from "next-themes";
import { useColorTheme } from "@/components/theme-provider";
import { themes, themeNames, type ThemeName } from "@/lib/themes";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const modes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how the app looks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Mode</p>
          <div className="flex items-center gap-2">
            {modes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                  theme === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Color</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {themeNames.map((name) => {
              const t = themes[name];
              return (
                <button
                  key={name}
                  onClick={() => setColorTheme(name as ThemeName)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    colorTheme === name
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "border-input hover:border-primary/50"
                  )}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: `hsl(${t.activeColor})` }}
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
