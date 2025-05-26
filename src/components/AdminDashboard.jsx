import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './Login';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Workshop state
  const [title, setTitle] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [speakers, setSpeakers] = useState(['']);
  const [sessions, setSessions] = useState([{ date: '', time: '', teamsLink: '', youtubePlaylistLink: '' }]);
  const [workshops, setWorkshops] = useState([]);
  const [editingWorkshop, setEditingWorkshop] = useState(null);

  // Team state
  const [teamName, setTeamName] = useState('');
  const [teamLinkedIn, setTeamLinkedIn] = useState('');
  const [teamPosition, setTeamPosition] = useState('');
  const [teamPicture, setTeamPicture] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [editingTeamMember, setEditingTeamMember] = useState(null);

  // Speakers state
  const [speakerName, setSpeakerName] = useState('');
  const [speakerLinkedIn, setSpeakerLinkedIn] = useState('');
  const [speakerPosition, setSpeakerPosition] = useState('');
  const [speakerPicture, setSpeakerPicture] = useState(null);
  const [speakerList, setSpeakerList] = useState([]);
  const [editingSpeaker, setEditingSpeaker] = useState(null);

  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
        fetchWorkshops();
        fetchTeamMembers();
        fetchSpeakers();
      } else {
        setIsAdmin(false);
        setWorkshops([]);
        setTeamMembers([]);
        setSpeakerList([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Workshops
  const fetchWorkshops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'workshops'));
      const workshopList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkshops(workshopList);
    } catch (err) {
      setError('Failed to fetch workshops: ' + err.message);
    }
  };

  // Fetch Team Members
  const fetchTeamMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'team'));
      const teamList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(teamList);
    } catch (err) {
      setError('Failed to fetch team members: ' + err.message);
    }
  };

  // Fetch Speakers
  const fetchSpeakers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'speakers'));
      const speakerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpeakerList(speakerList);
    } catch (err) {
      setError('Failed to fetch speakers: ' + err.message);
    }
  };

  // Workshop Handlers
  const handleAddSpeaker = () => {
    setSpeakers([...speakers, '']);
  };

  const handleSpeakerChange = (index, value) => {
    const newSpeakers = [...speakers];
    newSpeakers[index] = value;
    setSpeakers(newSpeakers);
  };

  const handleRemoveSpeaker = (index) => {
    if (speakers.length > 1) {
      setSpeakers(speakers.filter((_, i) => i !== index));
    }
  };

  const handleAddSession = () => {
    setSessions([...sessions, { date: '', time: '', teamsLink: '', youtubePlaylistLink: '' }]);
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };

  const handleRemoveSession = (index) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((_, i) => i !== index));
    }
  };

  const handleSubmitWorkshop = async (e) => {
    e.preventDefault();
    setError('');

    const validSessions = sessions.filter(session => session.date && session.time);
    if (validSessions.length === 0) {
      setError('At least one session with a date and time is required');
      return;
    }

    const validSpeakers = speakers.filter(speaker => speaker.trim() !== '');
    if (validSpeakers.length === 0) {
      setError('At least one speaker is required');
      return;
    }

    let thumbnailBase64 = editingWorkshop?.thumbnail || '';
    if (thumbnail) {
      if (thumbnail.size > 500 * 1024) {
        setError('Thumbnail size must be less than 500 KB');
        return;
      }
      thumbnailBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(thumbnail);
      });
    }

    try {
      if (editingWorkshop) {
        await updateDoc(doc(db, 'workshops', editingWorkshop.id), {
          title,
          prerequisites,
          resourceLink,
          thumbnail: thumbnailBase64,
          speakers: validSpeakers,
          sessions: validSessions
        });
      } else {
        await addDoc(collection(db, 'workshops'), {
          title,
          prerequisites,
          resourceLink,
          thumbnail: thumbnailBase64,
          speakers: validSpeakers,
          sessions: validSessions
        });
      }
      fetchWorkshops();
      resetWorkshopForm();
    } catch (err) {
      setError(`Failed to ${editingWorkshop ? 'update' : 'add'} workshop: ` + err.message);
    }
  };

  const handleEditWorkshop = (workshop) => {
    setEditingWorkshop(workshop);
    setTitle(workshop.title);
    setPrerequisites(workshop.prerequisites || '');
    setResourceLink(workshop.resourceLink || '');
    setThumbnail(null);
    setSpeakers(workshop.speakers && workshop.speakers.length > 0 ? workshop.speakers : ['']);
    setSessions(workshop.sessions && workshop.sessions.length > 0 ? workshop.sessions.map(session => ({
      date: session.date,
      time: session.time || '',
      teamsLink: session.teamsLink || '',
      youtubePlaylistLink: session.youtubePlaylistLink || ''
    })) : [{ date: '', time: '', teamsLink: '', youtubePlaylistLink: '' }]);
  };

  const handleDeleteWorkshop = async (id) => {
    try {
      await deleteDoc(doc(db, 'workshops', id));
      fetchWorkshops();
    } catch (err) {
      setError('Failed to delete workshop: ' + err.message);
    }
  };

  const resetWorkshopForm = () => {
    setTitle('');
    setPrerequisites('');
    setResourceLink('');
    setThumbnail(null);
    setSpeakers(['']);
    setSessions([{ date: '', time: '', teamsLink: '', youtubePlaylistLink: '' }]);
    setEditingWorkshop(null);
    setError('');
  };

  // Team Handlers
  const handleSubmitTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamName || !teamPosition) {
      setError('Name and position are required for team member');
      return;
    }

    let pictureBase64 = editingTeamMember?.picture || '';
    if (teamPicture) {
      if (teamPicture.size > 500 * 1024) {
        setError('Picture size must be less than 500 KB');
        return;
      }
      pictureBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(teamPicture);
      });
    }

    try {
      if (editingTeamMember) {
        await updateDoc(doc(db, 'team', editingTeamMember.id), {
          name: teamName,
          linkedin: teamLinkedIn || '',
          position: teamPosition,
          picture: pictureBase64
        });
      } else {
        await addDoc(collection(db, 'team'), {
          name: teamName,
          linkedin: teamLinkedIn || '',
          position: teamPosition,
          picture: pictureBase64
        });
      }
      fetchTeamMembers();
      resetTeamForm();
    } catch (err) {
      setError(`Failed to ${editingTeamMember ? 'update' : 'add'} team member: ` + err.message);
    }
  };

  const handleEditTeamMember = (member) => {
    setEditingTeamMember(member);
    setTeamName(member.name);
    setTeamLinkedIn(member.linkedin || '');
    setTeamPosition(member.position);
    setTeamPicture(null);
  };

  const handleDeleteTeamMember = async (id) => {
    try {
      await deleteDoc(doc(db, 'team', id));
      fetchTeamMembers();
    } catch (err) {
      setError('Failed to delete team member: ' + err.message);
    }
  };

  const resetTeamForm = () => {
    setTeamName('');
    setTeamLinkedIn('');
    setTeamPosition('');
    setTeamPicture(null);
    setEditingTeamMember(null);
    setError('');
  };

  // Speaker Handlers
  const handleSubmitSpeaker = async (e) => {
    e.preventDefault();
    setError('');

    if (!speakerName || !speakerPosition) {
      setError('Name and position are required for speaker');
      return;
    }

    let pictureBase64 = editingSpeaker?.picture || '';
    if (speakerPicture) {
      if (speakerPicture.size > 500 * 1024) {
        setError('Picture size must be less than 500 KB');
        return;
      }
      pictureBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(speakerPicture);
      });
    }

    try {
      if (editingSpeaker) {
        await updateDoc(doc(db, 'speakers', editingSpeaker.id), {
          name: speakerName,
          linkedin: speakerLinkedIn || '',
          position: speakerPosition,
          picture: pictureBase64
        });
      } else {
        await addDoc(collection(db, 'speakers'), {
          name: speakerName,
          linkedin: speakerLinkedIn || '',
          position: speakerPosition,
          picture: pictureBase64
        });
      }
      fetchSpeakers();
      resetSpeakerForm();
    } catch (err) {
      setError(`Failed to ${editingSpeaker ? 'update' : 'add'} speaker: ` + err.message);
    }
  };

  const handleEditSpeaker = (speaker) => {
    setEditingSpeaker(speaker);
    setSpeakerName(speaker.name);
    setSpeakerLinkedIn(speaker.linkedin || '');
    setSpeakerPosition(speaker.position);
    setSpeakerPicture(null);
  };

  const handleDeleteSpeaker = async (id) => {
    try {
      await deleteDoc(doc(db, 'speakers', id));
      fetchSpeakers();
    } catch (err) {
      setError('Failed to delete speaker: ' + err.message);
    }
  };

  const resetSpeakerForm = () => {
    setSpeakerName('');
    setSpeakerLinkedIn('');
    setSpeakerPosition('');
    setSpeakerPicture(null);
    setEditingSpeaker(null);
    setError('');
  };

  if (!isAdmin) {
    return <Login setIsAdmin={setIsAdmin} />;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {/* Workshop Management */}
      <div className="admin-section">
        <h3>Manage Workshops</h3>
        <form onSubmit={handleSubmitWorkshop}>
          <h4>{editingWorkshop ? 'Edit Workshop' : 'Add Workshop'}</h4>
          <input
            type="text"
            placeholder="Workshop Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Prerequisites"
            value={prerequisites}
            onChange={(e) => setPrerequisites(e.target.value)}
          />
          <input
            type="url"
            placeholder="Resource Link (e.g., https://example.com)"
            value={resourceLink}
            onChange={(e) => setResourceLink(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files[0])}
          />
          <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
            Thumbnail max size: 500 KB (Image only)
          </p>
          <h5>Speakers</h5>
          {speakers.map((speaker, index) => (
            <div key={index} className="speaker-input">
              <input
                type="text"
                placeholder="Speaker Name"
                value={speaker}
                onChange={(e) => handleSpeakerChange(index, e.target.value)}
                required
              />
              {speakers.length > 1 && (
                <button type="button" onClick={() => handleRemoveSpeaker(index)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddSpeaker}>
            Add Speaker
          </button>
          <h5>Sessions</h5>
          {sessions.map((session, index) => (
            <div key={index} className="session-input">
              <input
                type="date"
                value={session.date}
                onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                required
              />
              <input
                type="time"
                value={session.time}
                onChange={(e) => handleSessionChange(index, 'time', e.target.value)}
                required
              />
              <input
                type="url"
                placeholder="Microsoft Teams Link (optional until 1 hr before)"
                value={session.teamsLink}
                onChange={(e) => handleSessionChange(index, 'teamsLink', e.target.value)}
              />
              <input
                type="url"
                placeholder="YouTube Playlist Link (optional, add after session)"
                value={session.youtubePlaylistLink}
                onChange={(e) => handleSessionChange(index, 'youtubePlaylistLink', e.target.value)}
              />
              {sessions.length > 1 && (
                <button type="button" onClick={() => handleRemoveSession(index)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddSession}>
            Add Session
          </button>
          {error && <p className="error">{error}</p>}
          <div className="form-buttons">
            <button type="submit">{editingWorkshop ? 'Update Workshop' : 'Add Workshop'}</button>
            {editingWorkshop && (
              <button type="button" onClick={resetWorkshopForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
        <h4>Workshops</h4>
        <div className="workshop-list">
          {workshops.map(workshop => (
            <div key={workshop.id} className="workshop-item">
              <p>{workshop.title}</p>
              <div>
                <button onClick={() => handleEditWorkshop(workshop)}>Edit</button>
                <button onClick={() => handleDeleteWorkshop(workshop.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Management */}
      <div className="admin-section">
        <h3>Manage Team Members</h3>
        <form onSubmit={handleSubmitTeam}>
          <h4>{editingTeamMember ? 'Edit Team Member' : 'Add Team Member'}</h4>
          <input
            type="text"
            placeholder="Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
          <input
            type="url"
            placeholder="LinkedIn URL (optional)"
            value={teamLinkedIn}
            onChange={(e) => setTeamLinkedIn(e.target.value)}
          />
          <input
            type="text"
            placeholder="Position"
            value={teamPosition}
            onChange={(e) => setTeamPosition(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setTeamPicture(e.target.files[0])}
          />
          <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
            Picture max size: 500 KB (Image only)
          </p>
          {error && <p className="error">{error}</p>}
          <div className="form-buttons">
            <button type="submit">{editingTeamMember ? 'Update Team Member' : 'Add Team Member'}</button>
            {editingTeamMember && (
              <button type="button" onClick={resetTeamForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
        <h4>Team Members</h4>
        <div className="team-list">
          {teamMembers.map(member => (
            <div key={member.id} className="team-item">
              <p>{member.name} - {member.position}</p>
              <div>
                <button onClick={() => handleEditTeamMember(member)}>Edit</button>
                <button onClick={() => handleDeleteTeamMember(member.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Speaker Management */}
      <div className="admin-section">
        <h3>Manage Speakers</h3>
        <form onSubmit={handleSubmitSpeaker}>
          <h4>{editingSpeaker ? 'Edit Speaker' : 'Add Speaker'}</h4>
          <input
            type="text"
            placeholder="Name"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            required
          />
          <input
            type="url"
            placeholder="LinkedIn URL (optional)"
            value={speakerLinkedIn}
            onChange={(e) => setSpeakerLinkedIn(e.target.value)}
          />
          <input
            type="text"
            placeholder="Position"
            value={speakerPosition}
            onChange={(e) => setSpeakerPosition(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSpeakerPicture(e.target.files[0])}
          />
          <p style={{ fontSize: '12px', color: '#e0e0e0' }}>
            Picture max size: 500 KB (Image only)
          </p>
          {error && <p className="error">{error}</p>}
          <div className="form-buttons">
            <button type="submit">{editingSpeaker ? 'Update Speaker' : 'Add Speaker'}</button>
            {editingSpeaker && (
              <button type="button" onClick={resetSpeakerForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
        <h4>Speakers</h4>
        <div className="speaker-list">
          {speakerList.map(speaker => (
            <div key={speaker.id} className="speaker-item">
              <p>{speaker.name} - {speaker.position}</p>
              <div>
                <button onClick={() => handleEditSpeaker(speaker)}>Edit</button>
                <button onClick={() => handleDeleteSpeaker(speaker.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;