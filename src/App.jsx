import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Team from './components/Team';
import Speakers from './components/Speakers';
import Home from './pages/Home';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student" element={<StudentDashboard />}>
          <Route path="team" element={<Team />} />
          <Route path="speakers" element={<Speakers />} />
        </Route>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
