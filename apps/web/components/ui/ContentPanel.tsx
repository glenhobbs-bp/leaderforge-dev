import { useTheme } from "@/components/ui/ThemeContext";

export default function ContentPanel() {
  const theme = useTheme();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Main Content Panel</h1>
      <p className="text-gray-600 dark:text-gray-300">
        This is where your dynamic content for the selected module will appear.
      </p>
    </div>
  );
}