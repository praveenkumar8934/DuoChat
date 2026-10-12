'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themes = [
    {
      id: 'light',
      label: 'Light Mode',
      desc: 'Crisp white interface with soft contrasts',
      icon: Sun,
      iconColor: 'text-amber-500',
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      desc: 'Deep navy background for nighttime comfort',
      icon: Moon,
      iconColor: 'text-violet-400',
    },
    {
      id: 'system',
      label: 'System Sync',
      desc: 'Automatically matches your OS preference',
      icon: Laptop,
      iconColor: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Appearance & Theme</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customize the aesthetic and theme of your messaging space
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Color Theme</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map(t => {
              const Icon = t.icon;
              const isSelected = theme === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 relative select-none',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border/70 bg-background/50 hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn('w-5 h-5', t.iconColor)} />
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{t.label}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Chat Bubble Preview */}
        <div className="pt-6 border-t border-border/60 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Message Bubble Aesthetic</h3>
          <p className="text-xs text-muted-foreground">
            Current typography and rounded corner preview
          </p>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3 max-w-md">
            <div className="flex items-start">
              <div className="p-3 rounded-2xl rounded-bl-xs bg-card border border-border text-xs text-card-foreground shadow-xs">
                Good morning! How is the current theme feeling?
              </div>
            </div>
            <div className="flex items-end justify-end">
              <div className="p-3 rounded-2xl rounded-br-xs bg-primary text-primary-foreground text-xs shadow-sm">
                Clean, legible, and easy on the eyes! ✨
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
