import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/Team.css';

function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'team'));
        const teamList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeamMembers(teamList);
        setError('');
      } catch (err) {
        setError('Failed to fetch team members: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  return (
    <div className="team-page">
      <h2>Our Team</h2>
      {loading ? (
        <p>Loading team members...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : teamMembers.length > 0 ? (
        <div className="team-list">
          {teamMembers.map(member => (
            <div key={member.id} className="team-card">
              {member.picture && (
                <img
                  src={member.picture}
                  alt={member.name}
                  className="team-picture"
                />
              )}
              <h3>{member.name}</h3>
              <p><strong>Role:</strong> {member.role}</p>
              {member.description && (
                <p><strong>Description:</strong> {member.description}</p>
              )}
              <div className="social-links">
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                )}
                {member.github && (
                  <a href={member.github} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No team members available.</p>
      )}
    </div>
  );
}

export default Team;