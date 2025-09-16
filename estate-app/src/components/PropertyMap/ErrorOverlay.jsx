const ErrorOverlay = ({ error }) => {
  if (!error) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 border border-red-200 rounded-lg p-3 w-fit">
      <div className="flex items-center">
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;
