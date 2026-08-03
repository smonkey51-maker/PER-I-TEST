const GRADIENTS = [
  "linear-gradient(135deg,#fa233b,#fc3c44)",
  "linear-gradient(135deg,#fa943a,#fa233b)",
  "linear-gradient(135deg,#af52de,#fa233b)",
  "linear-gradient(135deg,#30d158,#0a8a3f)",
  "linear-gradient(135deg,#0a84ff,#5e5ce6)",
  "linear-gradient(135deg,#ffd60a,#fa943a)",
  "linear-gradient(135deg,#5e5ce6,#fa233b)",
  "linear-gradient(135deg,#ff375f,#af52de)",
];

function hashToIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

interface GenreTileProps {
  name: string;
  id: string;
}

export function GenreTile({ name, id }: GenreTileProps) {
  const gradient = GRADIENTS[hashToIndex(id, GRADIENTS.length)];

  return (
    <div
      className="am-card-shadow flex h-28 items-start rounded-xl p-3 text-left"
      style={{ background: gradient }}
    >
      <span className="text-base font-bold leading-tight text-white drop-shadow">{name}</span>
    </div>
  );
}
