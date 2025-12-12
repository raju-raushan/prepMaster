import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './routes/Home';
import { SessionSetup } from './routes/SessionSetup';
import { LiveSession } from './routes/LiveSession';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<SessionSetup />} />
        <Route path="/live" element={<LiveSession />} />
      </Routes>
    </Router>
  );
}

export default App;
