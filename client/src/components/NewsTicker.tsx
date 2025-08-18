export function NewsTicker() {
  const newsItems = [
    { icon: "fas fa-star", color: "text-game-gold", text: "New character \"Aria\" unlocked!" },
    { icon: "fas fa-gift", color: "text-game-amber", text: "Double LP weekend event active" },
    { icon: "fas fa-trophy", color: "text-game-gold", text: "Player \"Shadow\" reached level 100!" },
    { icon: "fas fa-sparkles", color: "text-game-cyan", text: "New VIP content available" },
  ];

  return (
    <div className="h-8 bg-game-secondary/50 border-b border-game-accent/10 overflow-hidden" data-testid="news-ticker">
      <div className="h-full flex items-center">
        <div className="animate-ticker whitespace-nowrap text-sm text-game-cyan">
          {newsItems.map((item, index) => (
            <span key={index} className="mr-8">
              <i className={`${item.icon} ${item.color} mr-2`}></i>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
