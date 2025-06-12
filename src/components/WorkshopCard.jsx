import { useState } from 'react';
import WorkshopModal from './WorkshopModal';
import '../styles/WorkshopCard.css';

function WorkshopCard({ workshop, showPastSessions = false }) {
  const [showModal, setShowModal] = useState(false);
  const currentTime = new Date('2025-05-26T02:44:00+05:30');
  
  const isSessionPast = (sessionDate, sessionTime, isDateTBA, isTimeTBA) => {
    // If date or time is TBA, consider it as future session
    if (isDateTBA || isTimeTBA) return false;
    
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    return sessionDateTime < currentTime;
  };

  const formatTime = (time, isTimeTBA) => {
    if (isTimeTBA) return 'TBA';
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCardClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="workshop-card" onClick={handleCardClick}>
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
        <h4>Sessions:</h4>
        {workshop.sessions && workshop.sessions.length > 0 ? (
          <div className="sessions-container">
            {workshop.sessions.slice(0, 2).map((session, index) => {
              const isPast = isSessionPast(session.date, session.time, session.isDateTBA, session.isTimeTBA);
              if (!showPastSessions && isPast) return null;
              
              return (
                <div key={index} className="session-item">
                  <div className="session-datetime">
                    <div className="session-date">
                      {formatDate(session.date, session.isDateTBA)}
                    </div>
                    <div className={`session-time ${session.isTimeTBA ? 'tba-time' : ''}`}>
                      {formatTime(session.time, session.isTimeTBA)}
                    </div>
                  </div>
                </div>
              );
            })}
            {workshop.sessions.length > 2 && (
              <p className="more-sessions">+{workshop.sessions.length - 2} more sessions</p>
            )}
          </div>
        ) : (
          <p>No sessions scheduled.</p>
        )}
        <div className="click-hint">Click for more details</div>
      </div>
      
      {showModal && (
        <WorkshopModal 
          workshop={workshop} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}

export default WorkshopCard;