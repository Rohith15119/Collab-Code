export default function SharedView() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold">Shared View</h1>

        <p className="text-gray-400">This view is shared with other users.</p>

        <p className="text-gray-500 text-sm">
          🚧 This feature is currently under development.
        </p>
      </div>
    </div>
  );
}
