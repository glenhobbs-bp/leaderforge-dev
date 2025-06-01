import { ContentSchema, CardAction } from "../../../../packages/agent-core/types/contentSchema";

export function ContentSchemaRenderer({ schema }: { schema: ContentSchema }) {
  switch (schema.type) {
    case "Panel":
      return (
        <div>
          <h2>{schema.props.heading}</h2>
          {schema.props.description && <p>{schema.props.description}</p>}
          {schema.props.widgets &&
            schema.props.widgets.map((w, i) => (
              <ContentSchemaRenderer key={i} schema={w} />
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
            {schema.props.items.map((item, i) => (
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
              <div key={video.id} className="rounded-lg shadow bg-white p-4 flex flex-col items-center">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded mb-2"
                  onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
                />
                <div className="font-medium text-center">{video.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "Grid":
      return (
        <div className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {schema.props.items.map((item, i) => (
              <ContentSchemaRenderer key={i} schema={item} />
            ))}
          </div>
        </div>
      );
    case "Card":
      return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full min-h-[340px]">
          {schema.props.image && (
            <img
              src={schema.props.image}
              alt={schema.props.title}
              className="w-full h-40 object-cover rounded-t-lg"
              onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
            />
          )}
          <div className="flex-1 flex flex-col p-4">
            <h4 className="font-semibold text-lg mb-1">{schema.props.title}</h4>
            {schema.props.subtitle && <div className="text-sm text-gray-500 mb-1">{schema.props.subtitle}</div>}
            {schema.props.description && <p className="text-sm text-gray-700 mb-2 flex-1">{schema.props.description}</p>}
            {typeof schema.props.progress === "number" && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-[var(--primary)] h-2 rounded-full"
                  style={{ width: `${schema.props.progress}%` }}
                />
              </div>
            )}
            {schema.props.actions && schema.props.actions.length > 0 && (
              <div className="flex gap-2 mt-auto">
                {schema.props.actions.map((action: CardAction, i: number) => (
                  <button
                    key={i}
                    className="px-3 py-1 rounded bg-[var(--primary)] text-white text-sm hover:bg-[var(--accent)] transition"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    default:
      return <div>Unknown schema type: {(schema as any).type}</div>;
  }
}