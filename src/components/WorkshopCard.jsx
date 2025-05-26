import '../styles/WorkshopCard.css';

function WorkshopCard({ workshop, showPastSessions = false }) {
  const currentTime = new Date('2025-05-26T02:44:00+05:30'); // Current time: 02:44 AM IST, May 26, 2025

  const isLinkExpected = (sessionDate, sessionTime) => {
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes);
    const oneHourBefore = new Date(sessionDateTime.getTime() - 60 * 60 * 1000); // 1 hour before session
    return currentTime >= oneHourBefore && currentTime <= sessionDateTime;
  };

  const isSessionPast = (sessionDate, sessionTime) => {
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(hours, minutes);
    return currentTime > sessionDateTime;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="workshop-card">
      {workshop.thumbnail && (
        <img
          src={workshop.thumbnail}
          alt={workshop.title}
          className="workshop-thumbnail"
        />
      )}
      <h3>{workshop.title}</h3>
      <p><strong>Speakers:</strong> {workshop.speakers?.length > 0 ? workshop.speakers.join(', ') : 'TBD'}</p>
      <p><strong>Prerequisites:</strong> {workshop.prerequisites || 'None'}</p>
      <h4>{showPastSessions ? 'Past Sessions:' : 'Upcoming Sessions:'}</h4>
      {workshop.sessions && workshop.sessions.length > 0 ? (
        <ul>
          {workshop.sessions
            .filter(session => showPastSessions ? isSessionPast(session.date, session.time) : !isSessionPast(session.date, session.time))
            .map((session, index) => (
              <li key={index}>
                <strong>{new Date(session.date).toLocaleDateString()} at {formatTime(session.time)}:</strong>{' '}
                {showPastSessions ? (
                  session.youtubePlaylistLink ? (
                    <a href={session.youtubePlaylistLink} target="_blank" rel="noopener noreferrer">
                      Watch on YouTube
                    </a>
                  ) : (
                    <span className="pending-link">YouTube link not yet uploaded</span>
                  )
                ) : session.teamsLink ? (
                  <a href={session.teamsLink} target="_blank" rel="noopener noreferrer">
                    Join on Microsoft Teams
                  </a>
                ) : isLinkExpected(session.date, session.time) ? (
                  <span className="pending-link">Link not yet uploaded</span>
                ) : (
                  <span>Link available 1 hour before session</span>
                )}
              </li>
            ))}
        </ul>
      ) : (
        <p>No {showPastSessions ? 'past' : 'upcoming'} sessions.</p>
      )}
      {workshop.resourceLink && (
        <a href={workshop.resourceLink} target="_blank" rel="noopener noreferrer">
          <button>Resource Link</button>
        </a>
      )}
    </div>
  );
}

export default WorkshopCard;