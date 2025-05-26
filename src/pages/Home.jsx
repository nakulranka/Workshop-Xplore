import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <h1>Summer-XPLORE 2025</h1>
      <p className="tagline">learn and grow</p>
      <div>
        <Link to="/admin"><button>Admin Dashboard</button></Link>
        <Link to="/student"><button>Student Dashboard</button></Link>
      </div>
    </div>
  );
}

export default Home;