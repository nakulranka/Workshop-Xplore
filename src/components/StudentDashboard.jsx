import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import WorkshopCard from './WorkshopCard';
import Team from './Team';
import Speakers from './Speakers';
import '../styles/StudentDashboard.css';

function StudentDashboard() {
  const [workshops, setWorkshops] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showTeam, setShowTeam] = useState(false);
  const [showSpeakers, setShowSpeakers] = useState(false);
  const location = useLocation();

  const currentTime = new Date('2025-05-26T03:07:00+05:30'); // Current time: 03:07 AM IST, May 26, 2025

  const fetchWorkshops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'workshops'));
      const workshopList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkshops(workshopList);
      setError('');
    } catch (err) {
      setError('Failed to fetch workshops: ' + err.message);
    }
  };

  useEffect(() => {
    fetchWorkshops();
    const interval = setInterval(fetchWorkshops, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const isSessionPast = (session) => {
    const [hours, minutes] = session.time.split(':').map(Number);
    const sessionDateTime = new Date(session.date);
    sessionDateTime.setHours(hours, minutes);
    return currentTime > sessionDateTime;
  };

  const isSessionUpcoming = (session) => {
    const [hours, minutes] = session.time.split(':').map(Number);
    const sessionDateTime = new Date(session.date);
    sessionDateTime.setHours(hours, minutes);
    return currentTime <= sessionDateTime;
  };

  const hasPastSessions = (workshop) => {
    return workshop.sessions?.some(session => isSessionPast(session));
  };

  const hasUpcomingSessions = (workshop) => {
    return workshop.sessions?.some(session => isSessionUpcoming(session));
  };

  const sortWorkshopsByDateTime = (workshopsToSort) => {
    return [...workshopsToSort].sort((a, b) => {
      const earliestDateA = a.sessions?.length > 0 ? new Date(Math.min(...a.sessions.map(s => {
        const [hours, minutes] = s.time.split(':').map(Number);
        const dt = new Date(s.date);
        dt.setHours(hours, minutes);
        return dt.getTime();
      }))) : new Date(0);
      const earliestDateB = b.sessions?.length > 0 ? new Date(Math.min(...b.sessions.map(s => {
        const [hours, minutes] = s.time.split(':').map(Number);
        const dt = new Date(s.date);
        dt.setHours(hours, minutes);
        return dt.getTime();
      }))) : new Date(0);
      return earliestDateA - earliestDateB;
    });
  };

  const pastWorkshops = sortWorkshopsByDateTime(workshops.filter(hasPastSessions));
  const upcomingWorkshops = sortWorkshopsByDateTime(workshops.filter(hasUpcomingSessions));

  const workshopsOnDate = upcomingWorkshops.filter(workshop =>
    workshop.sessions?.some(session => {
      try {
        return new Date(session.date).toDateString() === selectedDate.toDateString();
      } catch {
        return false;
      }
    })
  );

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const isDashboardView = location.pathname === '/student';

  return (
    <div className="student-dashboard">
      <h2>Student Dashboard</h2>
      <div className="top-right-buttons">
        <button onClick={() => { setShowTeam(!showTeam); setShowSpeakers(false); }}>Team</button>
        <button onClick={() => { setShowSpeakers(!showSpeakers); setShowTeam(false); }}>Speakers</button>
      </div>
      <nav className="dashboard-nav">
        <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>Upcoming Workshops</button>
        <button className={activeTab === 'done' ? 'active' : ''} onClick={() => setActiveTab('done')}>Done Workshops</button>
        <button className={activeTab === 'scheduled' ? 'active' : ''} onClick={() => setActiveTab('scheduled')}>Scheduled Workshops</button>
      </nav>
      {error && <p className="error">{error}</p>}

      <div className={showTeam || showSpeakers ? "dashboard-content blurred" : "dashboard-content"}>
        {!showTeam && !showSpeakers && activeTab === 'upcoming' && (
          <div className="all-workshops-section">
            <h3>Upcoming Workshops</h3>
            {upcomingWorkshops.length > 0 ? (
              <div className="workshops-list">
                {upcomingWorkshops.map(workshop => (
                  <div key={workshop.id} className="workshop-summary">
                    <h4>{workshop.title}</h4>
                    {workshop.thumbnail && (
                      <img
                        src={workshop.thumbnail}
                        alt={workshop.title}
                        className="workshop-thumbnail-small"
                      />
                    )}
                    <p><strong>Speakers:</strong> {workshop.speakers?.length > 0 ? workshop.speakers.join(', ') : 'TBD'}</p>
                    <p><strong>Prerequisites:</strong> {workshop.prerequisites || 'None'}</p>
                    <p><strong>Upcoming Sessions:</strong></p>
                    {workshop.sessions && workshop.sessions.length > 0 ? (
                      <ul>
                        {workshop.sessions
                          .filter(session => isSessionUpcoming(session))
                          .map((session, index) => (
                            <li key={index}>
                              {new Date(session.date).toLocaleDateString()} at {formatTime(session.time)}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p>No upcoming sessions.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No upcoming workshops scheduled.</p>
            )}
          </div>
        )}
        {!showTeam && !showSpeakers && activeTab === 'done' && (
          <div className="past-workshops-section">
            <h3>Done Workshops</h3>
            {pastWorkshops.length > 0 ? (
              <div className="workshops-list">
                {pastWorkshops.map(workshop => (
                  <WorkshopCard key={workshop.id} workshop={workshop} showPastSessions={true} />
                ))}
              </div>
            ) : (
              <p>No workshops have been completed yet.</p>
            )}
          </div>
        )}
        {!showTeam && !showSpeakers && activeTab === 'scheduled' && (
          <div className="calendar-section">
            <h3>Scheduled Workshops</h3>
            <div className="calendar-container">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={({ date }) => {
                  const hasWorkshop = upcomingWorkshops.some(workshop =>
                    workshop.sessions?.some(session => {
                      try {
                        return new Date(session.date).toDateString() === date.toDateString();
                      } catch {
                        return false;
                      }
                    })
                  );
                  return hasWorkshop ? <p className="workshop-indicator">•</p> : null;
                }}
              />
            </div>
            <div className="workshops-container">
              <h4>Upcoming Workshops on {selectedDate.toLocaleDateString()}</h4>
              {workshopsOnDate.length > 0 ? (
                workshopsOnDate.map(workshop => (
                  <WorkshopCard key={workshop.id} workshop={workshop} showPastSessions={false} />
                ))
              ) : (
                <p>No upcoming workshops scheduled on this date.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {(showTeam || showSpeakers) && (
        <div className="overlay-section">
          <button
            className="close-button"
            onClick={() => {
              setShowTeam(false);
              setShowSpeakers(false);
            }}
            aria-label="Close panel"
          >
            &times;
          </button>
          {showTeam && <Team />}
          {showSpeakers && <Speakers />}
        </div>
      )}

      {!isDashboardView && <Outlet />}
    </div>
  );
}

export default StudentDashboard;
