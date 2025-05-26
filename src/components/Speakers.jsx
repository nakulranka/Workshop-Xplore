import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/Speakers.css';

function Speakers() {
  const [speakers, setSpeakers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'speakers'));
        const speakerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSpeakers(speakerList);
        setError('');
      } catch (err) {
        setError('Failed to fetch speakers: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakers();
  }, []);

  return (
    <div className="speakers-page">
      <h2>Our Speakers</h2>
      {loading ? (
        <p>Loading speakers...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : speakers.length > 0 ? (
        <div className="speakers-list">
          {speakers.map(speaker => (
            <div key={speaker.id} className="speaker-card">
              {speaker.picture && (
                <img
                  src={speaker.picture}
                  alt={speaker.name}
                  className="speaker-picture"
                />
              )}
              <h3>{speaker.name}</h3>
              <p><strong>Position:</strong> {speaker.position}</p>
              {speaker.linkedin && (
                <p>
                  <strong>LinkedIn:</strong>{' '}
                  <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer">
                    Profile
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No speakers available.</p>
      )}
    </div>
  );
}

export default Speakers;