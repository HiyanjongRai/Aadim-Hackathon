// HeroSection.js
import React from 'react';
import './Hero.css';
import voteImg from './pexels-element5-1550337.jpg'; // Replace with your image path

const Hero = () => {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1><span>Create a poll</span><br /><span>in seconds</span></h1>
        <p>
          Want to ask your friends where to go friday night or arrange a meeting <span style={{color:"white"}}>with co-workers?</span>
          Create a poll – and get answers in no time.
        </p>
        <div className="hero-buttons">
          <button className="btn hero-btn1">Create a poll</button>
          <button className="btn hero-btn2">Live Demo</button>
        </div>
      </div>
      <div className="hero-image">
        <img src={voteImg} alt="vote" />
      </div>
    </div>
  );
};

export default Hero;
