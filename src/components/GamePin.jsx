export default function GamePin({ pin }) {
  const digits = pin?.toString().split('') || [];
  return (
    <div className="text-center animate-scale-in">
      <p className="text-white/60 text-sm mb-2 uppercase tracking-wider font-medium">Game PIN</p>
      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <span key={i} className="inline-flex items-center justify-center bg-white text-primary-dark
            text-4xl md:text-6xl font-bold font-display w-12 h-16 md:w-16 md:h-20 rounded-lg shadow-lg
            animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
