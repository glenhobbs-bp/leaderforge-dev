interface ContentPanelProps {
  heading: string;
  description: string;
}

export default function ContentPanel({ heading, description }: ContentPanelProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{heading}</h1>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}