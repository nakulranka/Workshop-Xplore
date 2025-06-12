import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './Login';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('team');

  // Workshop state
  const [title, setTitle] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [speakers, setSpeakers] = useState(['']);
  const [sessions, setSessions] = useState([{ date: '', time: '', youtubePlaylistLink: '', isDateTBA: false, isTimeTBA: false }]);
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
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch functions remain the same...
  const fetchWorkshops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'workshops'));
      const workshopList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkshops(workshopList);
    } catch (err) {
      setError('Failed to fetch workshops: ' + err.message);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'team'));
      const teamList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeamMembers(teamList);
    } catch (err) {
      setError('Failed to fetch team members: ' + err.message);
    }
  };

  const fetchSpeakers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'speakers'));
      const speakersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpeakerList(speakersList);
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
      const newSpeakers = speakers.filter((_, i) => i !== index);
      setSpeakers(newSpeakers);
    }
  };

  const handleAddSession = () => {
    setSessions([...sessions, { date: '', time: '', youtubePlaylistLink: '', isDateTBA: false, isTimeTBA: false }]);
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };

  const handleTBAToggle = (index, field) => {
    const newSessions = [...sessions];
    newSessions[index][field] = !newSessions[index][field];
    
    // Clear the actual date/time when TBA is enabled
    if (newSessions[index][field]) {
      if (field === 'isDateTBA') {
        newSessions[index].date = '';
      } else if (field === 'isTimeTBA') {
        newSessions[index].time = '';
      }
    }
    
    setSessions(newSessions);
  };

  const handleRemoveSession = (index) => {
    if (sessions.length > 1) {
      const newSessions = sessions.filter((_, i) => i !== index);
      setSessions(newSessions);
    }
  };

  const handleSubmitWorkshop = async (e) => {
    e.preventDefault();
    setError('');

    // Validate sessions - allow TBA sessions
    const validSessions = sessions.filter(session => 
      session.isDateTBA || session.isTimeTBA || (session.date && session.time)
    );
    
    if (validSessions.length === 0) {
      setError('Please add at least one session with date/time or mark as TBA');
      return;
    }

    const validSpeakers = speakers.filter(speaker => speaker.trim() !== '');
    if (validSpeakers.length === 0) {
      setError('Please add at least one speaker');
      return;
    }

    let thumbnailBase64 = editingWorkshop?.thumbnail || '';
    if (thumbnail) {
      if (thumbnail.size > 500000) {
        setError('Thumbnail size should be less than 500 KB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async () => {
        thumbnailBase64 = reader.result;
        await saveWorkshop(thumbnailBase64, validSessions, validSpeakers);
      };
      reader.readAsDataURL(thumbnail);
    } else {
      await saveWorkshop(thumbnailBase64, validSessions, validSpeakers);
    }
  };

  const saveWorkshop = async (thumbnailBase64, validSessions, validSpeakers) => {
    try {
      const workshopData = {
        title,
        prerequisites,
        resourceLink,
        thumbnail: thumbnailBase64,
        speakers: validSpeakers,
        sessions: validSessions
      };

      if (editingWorkshop) {
        await updateDoc(doc(db, 'workshops', editingWorkshop.id), workshopData);
      } else {
        await addDoc(collection(db, 'workshops'), workshopData);
      }

      resetWorkshopForm();
      fetchWorkshops();
    } catch (err) {
      setError('Failed to save workshop: ' + err.message);
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
      date: session.date || '',
      time: session.time || '',
      youtubePlaylistLink: session.youtubePlaylistLink || '',
      isDateTBA: session.isDateTBA || false,
      isTimeTBA: session.isTimeTBA || false
    })) : [{ date: '', time: '', youtubePlaylistLink: '', isDateTBA: false, isTimeTBA: false }]);
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
    setSessions([{ date: '', time: '', youtubePlaylistLink: '', isDateTBA: false, isTimeTBA: false }]);
    setEditingWorkshop(null);
    setError('');
  };

  // Team and Speaker handlers remain the same...
  const handleSubmitTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamName || !teamPosition) {
      setError('Please fill in all required fields');
      return;
    }

    let pictureBase64 = editingTeamMember?.picture || '';
    if (teamPicture) {
      if (teamPicture.size > 500000) {
        setError('Picture size should be less than 500 KB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async () => {
        pictureBase64 = reader.result;
        await saveTeamMember(pictureBase64);
      };
      reader.readAsDataURL(teamPicture);
    } else {
      await saveTeamMember(pictureBase64);
    }
  };

  const saveTeamMember = async (pictureBase64) => {
    try {
      const memberData = {
        name: teamName,
        linkedin: teamLinkedIn,
        role: teamPosition,
        picture: pictureBase64
      };

      if (editingTeamMember) {
        await updateDoc(doc(db, 'team', editingTeamMember.id), memberData);
      } else {
        await addDoc(collection(db, 'team'), memberData);
      }

      resetTeamForm();
      fetchTeamMembers();
    } catch (err) {
      setError('Failed to save team member: ' + err.message);
    }
  };

  const handleEditTeamMember = (member) => {
    setEditingTeamMember(member);
    setTeamName(member.name);
    setTeamLinkedIn(member.linkedin || '');
    setTeamPosition(member.role);
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

  const handleSubmitSpeaker = async (e) => {
    e.preventDefault();
    setError('');

    if (!speakerName || !speakerPosition) {
      setError('Please fill in all required fields');
      return;
    }

    let pictureBase64 = editingSpeaker?.picture || '';
    if (speakerPicture) {
      if (speakerPicture.size > 500000) {
        setError('Picture size should be less than 500 KB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async () => {
        pictureBase64 = reader.result;
        await saveSpeaker(pictureBase64);
      };
      reader.readAsDataURL(speakerPicture);
    } else {
      await saveSpeaker(pictureBase64);
    }
  };

  const saveSpeaker = async (pictureBase64) => {
    try {
      const speakerData = {
        name: speakerName,
        linkedin: speakerLinkedIn,
        role: speakerPosition,
        picture: pictureBase64
      };

      if (editingSpeaker) {
        await updateDoc(doc(db, 'speakers', editingSpeaker.id), speakerData);
      } else {
        await addDoc(collection(db, 'speakers'), speakerData);
      }

      resetSpeakerForm();
      fetchSpeakers();
    } catch (err) {
      setError('Failed to save speaker: ' + err.message);
    }
  };

  const handleEditSpeaker = (speaker) => {
    setEditingSpeaker(speaker);
    setSpeakerName(speaker.name);
    setSpeakerLinkedIn(speaker.linkedin || '');
    setSpeakerPosition(speaker.role);
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
      <nav className="dashboard-nav">
        <button className={activeTab === 'team' ? 'active' : ''} onClick={() => setActiveTab('team')}>Team</button>
        <button className={activeTab === 'workshops' ? 'active' : ''} onClick={() => setActiveTab('workshops')}>Workshops</button>
        <button className={activeTab === 'speakers' ? 'active' : ''} onClick={() => setActiveTab('speakers')}>Speakers</button>
      </nav>

      {activeTab === 'team' && (
        <div className="team-section">
          <h3>Manage Team</h3>
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
                <p>{member.name} - {member.role}</p>
                <div>
                  <button onClick={() => handleEditTeamMember(member)}>Edit</button>
                  <button onClick={() => handleDeleteTeamMember(member.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'workshops' && (
        <div className="workshops-section">
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
                <div className="session-row">
                  <div className="date-section">
                    <label>
                      <input
                        type="checkbox"
                        checked={session.isDateTBA}
                        onChange={() => handleTBAToggle(index, 'isDateTBA')}
                      />
                      Date TBA
                    </label>
                    {!session.isDateTBA && (
                      <input
                        type="date"
                        value={session.date}
                        onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                        required={!session.isDateTBA}
                      />
                    )}
                    {session.isDateTBA && (
                      <div className="tba-indicator">Date: To Be Announced</div>
                    )}
                  </div>
                  
                  <div className="time-section">
                    <label>
                      <input
                        type="checkbox"
                        checked={session.isTimeTBA}
                        onChange={() => handleTBAToggle(index, 'isTimeTBA')}
                      />
                      Time TBA
                    </label>
                    {!session.isTimeTBA && (
                      <input
                        type="time"
                        value={session.time}
                        onChange={(e) => handleSessionChange(index, 'time', e.target.value)}
                        required={!session.isTimeTBA}
                      />
                    )}
                    {session.isTimeTBA && (
                      <div className="tba-indicator">Time: To Be Announced</div>
                    )}
                  </div>
                </div>
                
                <input
                  type="url"
                  placeholder="YouTube Playlist Link (optional, add after session)"
                  value={session.youtubePlaylistLink}
                  onChange={(e) => handleSessionChange(index, 'youtubePlaylistLink', e.target.value)}
                />
                
                {sessions.length > 1 && (
                  <button type="button" onClick={() => handleRemoveSession(index)}>
                    Remove Session
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
      )}

      {activeTab === 'speakers' && (
        <div className="speakers-section">
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
                <p>{speaker.name} - {speaker.role}</p>
                <div>
                  <button onClick={() => handleEditSpeaker(speaker)}>Edit</button>
                  <button onClick={() => handleDeleteSpeaker(speaker.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;