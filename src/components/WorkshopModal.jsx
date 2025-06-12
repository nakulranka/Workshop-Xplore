import '../styles/WorkshopModal.css';

function WorkshopModal({ workshop, onClose }) {
  if (!workshop) return null;

  const formatTime = (time, isTimeTBA) => {
    if (isTimeTBA) return 'To Be Announced';
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString, isDateTBA) => {
    if (isDateTBA) return 'To Be Announced';
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="workshop-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        
        <div className="modal-content">
          {workshop.thumbnail && (
            <img
              src={workshop.thumbnail}
              alt={workshop.title}
              className="modal-thumbnail"
            />
          )}
          
          <h2 className="modal-title">{workshop.title}</h2>
          
          <div className="modal-section">
            <h3>Prerequisites</h3>
            <p>{workshop.prerequisites || 'None'}</p>
          </div>
          
          <div className="modal-section">
            <h3>Course to be Covered</h3>
            <p>{workshop.courseCovered || 'Not specified'}</p>
          </div>
          
          <div className="modal-section">
            <h3>Speakers</h3>
            <p>{workshop.speakers?.length > 0 ? workshop.speakers.join(', ') : 'TBD'}</p>
          </div>
          
          {workshop.resourceLink && (
            <div className="modal-section">
              <h3>Resource Link</h3>
              <a href={workshop.resourceLink} target="_blank" rel="noopener noreferrer" className="resource-link">
                Access Resources
              </a>
            </div>
          )}
          
          <div className="modal-section">
            <h3>Scheduled Sessions</h3>
            {workshop.sessions && workshop.sessions.length > 0 ? (
              <div className="sessions-list">
                {workshop.sessions.map((session, index) => (
                  <div key={index} className="session-detail">
                    <div className="session-info">
                      <div className={`session-date-modal ${session.isDateTBA ? 'tba-date' : ''}`}>
                        {formatDate(session.date, session.isDateTBA)}
                      </div>
                      <div className={`session-time-modal ${session.isTimeTBA ? 'tba-time' : ''}`}>
                        {formatTime(session.time, session.isTimeTBA)}
                      </div>
                    </div>
                    {session.youtubePlaylistLink && (
                      <a href={session.youtubePlaylistLink} target="_blank" rel="noopener noreferrer" className="recording-link-modal">
                        Watch Recording
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No sessions scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkshopModal;