import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="home">
      <h1>Welcome to <span className="highlight">Summer-XPLORE 2025</span></h1>
      <p className="tagline">Learn, grow, and explore endless possibilities!</p>
      <div className="home-buttons">
        <Link to="/admin"><button>Admin Dashboard</button></Link>
        <Link to="/student"><button>Student Dashboard</button></Link>
      </div>
    </div>
  );
}

export default Home;