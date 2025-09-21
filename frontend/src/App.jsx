import React from 'react';
import Contact from './Components/Contact';
import MainDashboard from './Components/MainDashboard';

const SubGraphs = () => (
  <div>
    <h2>Sub Graphs</h2>
    <p>This section will show subgraph visualizations or details.</p>
  </div>
);

const HowItWorks = () => (
  <div>
    <h2>How It Works</h2>
    <p>This section will explain how the prediction model functions.</p>
  </div>
);

import './App.css';

export default function App() {
  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <h2 className="sidebar-title">Prediction Model</h2>
        <nav className="nav">
          <a href="#dashboard" className="nav-item">Main</a>
          <a href="#subgraphs" className="nav-item">Sub Graphs</a>
          <a href="#how-it-works" className="nav-item">How it Works</a>
          <a href="#contact" className="nav-item">Contact</a>
        </nav>
      </aside>

      <main className="main-content">
        <section id="dashboard" className="section">
          <MainDashboard />
        </section>

        <section id="subgraphs" className="section">
          <SubGraphs />
        </section>

        <section id="how-it-works" className="section">
          <HowItWorks />
        </section>

        <section id="contact" className="section">
          <Contact />
        </section>
      </main>
    </div>
  );
}
