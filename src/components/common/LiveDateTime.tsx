import { useEffect, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

export const LiveDateTime = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="topbar-live-clock" aria-label={`${dateLabel}, ${timeLabel}`}>
      <span className="topbar-datetime-item topbar-clock-date">
        <CalendarDays size={14} aria-hidden="true" />
        <span>{dateLabel}</span>
      </span>
      <span className="topbar-datetime-divider" aria-hidden="true" />
      <span className="topbar-datetime-item topbar-clock-time">
        <Clock3 size={14} aria-hidden="true" />
        <span>{timeLabel}</span>
      </span>
    </div>
  );
};