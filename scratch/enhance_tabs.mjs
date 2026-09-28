
import fs from "fs";

let tabs = fs.readFileSync("src/components/ui/tabs.tsx", "utf8");
// Enhance the data-active styling for TabsTrigger
tabs = tabs.replace(
  `"data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",`,
  `"data-active:bg-[var(--color-apb-cyan)]/20 data-active:text-[var(--color-apb-cyan)] data-active:border-[var(--color-apb-cyan)]/50 data-active:shadow-[0_0_15px_rgba(34,211,238,0.4)] dark:data-active:border-[var(--color-apb-cyan)]/50 dark:data-active:bg-[var(--color-apb-cyan)]/20 dark:data-active:text-[var(--color-apb-cyan)] transition-all duration-300 font-bold",`
);

fs.writeFileSync("src/components/ui/tabs.tsx", tabs);
console.log("Enhanced Tabs");

