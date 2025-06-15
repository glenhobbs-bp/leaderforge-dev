import { ComponentSchema, CardAction } from "../../../../packages/agent-core/types/ComponentSchema";
import Image from "next/image";

export function ComponentSchemaRenderer({ schema }: { schema: ComponentSchema }) {
  // Debug: log the received schema
  console.log("[ComponentSchemaRenderer] schema:", schema);
  switch (schema.type) {
    case "Panel":
      return (
        <div>
          <h2>{schema.props.heading}</h2>
          {schema.props.description && <p>{schema.props.description}</p>}
          {schema.props.widgets &&
            schema.props.widgets.map((w, i) => (
              <ComponentSchemaRenderer key={i} schema={w} />
            ))}
        </div>
      );
    case "StatCard":
      return (
        <div className="rounded-lg shadow bg-white p-4 mb-4">
          <h3 className="font-semibold text-lg mb-1">{schema.props.title}</h3>
          <div className="text-2xl font-bold">{schema.props.value}</div>
          {schema.props.description && <p className="text-gray-500 text-sm mt-1">{schema.props.description}</p>}
        </div>
      );
    case "Leaderboard":
      return (
        <div className="rounded-lg shadow bg-white p-4 mb-4">
          <h3 className="font-semibold text-lg mb-2">{schema.props.title}</h3>
          <ol className="list-decimal pl-5">
            {schema.props.items && schema.props.items.map((item, i) => (
              <li key={i} className="flex justify-between py-1">
                <span>{item.name}</span>
                <span className="font-mono">{item.score}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "VideoList":
      return (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">{schema.props.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {schema.props.videos.map((video, i) => (
              <div key={video.props.title + i} className="rounded-lg shadow bg-white p-4 flex flex-col items-center">
                <img
                  src={video.props.image}
                  alt={video.props.title}
                  className="w-full h-32 object-cover rounded mb-2"
                  onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
                />
                <div className="font-medium text-center">{video.props.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "Grid":
      return (
        <div className="max-w-screen-2xl mx-auto p-6">
          <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {schema.props.items.map((item, i) => (
              <ComponentSchemaRenderer key={i} schema={item} />
            ))}
          </div>
        </div>
      );
    case "Card": {
      const {
        image,
        title,
        subtitle,
        description,
        videoWatched,
        worksheetSubmitted,
        progress,
        actions,
      } = schema.props;
      return (
        <div className="bg-[var(--card-bg)] rounded-xl shadow border border-[var(--bg-neutral)] flex flex-col h-full min-h-[340px] transition-transform hover:shadow-lg hover:scale-[1.025] duration-150">
          <div className="relative w-full aspect-video rounded-t-xl overflow-hidden px-0 lg:px-4">
            <Image
              src={image || "/icons/placeholder.png"}
              alt={title}
              fill
              className="object-cover rounded-t-xl"
              sizes="(max-width: 768px) 100vw, 400px"
              priority={false}
            />
            {/* Pill indicators */}
            <div className="absolute top-2 right-4 flex flex-row flex-wrap gap-1 z-10 items-end sm:items-center">
              {videoWatched === false && (
                <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-gray-200 shadow-sm whitespace-nowrap line-clamp-1">Video Not Watched</span>
              )}
              {worksheetSubmitted === false && (
                <span className="bg-yellow-50 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded-full font-normal border border-yellow-100 shadow-sm whitespace-nowrap line-clamp-1">Worksheet Not Submitted</span>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col p-3 sm:p-4">
            <h4 className="font-medium text-[15px] mb-0.5 text-gray-900">{title}</h4>
            {subtitle && <div className="text-xs text-gray-400 mb-0.5">{subtitle}</div>}
            {description && (
              <p className="text-xs text-gray-500 mb-1 leading-snug line-clamp-3">{description}</p>
            )}
            {/* Progress bar */}
            {typeof progress === "number" && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 mt-auto">
                <div
                  className="bg-[var(--primary)] h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                {actions.map((action: CardAction, i: number) => (
                  <button
                    key={i}
                    className="px-2 py-1 rounded bg-[var(--primary)] text-white text-[11px] hover:bg-[var(--accent)] transition font-normal w-full sm:w-auto"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    default:
      return <div>Unknown schema type: {(schema as any).type}</div>;
  }
}