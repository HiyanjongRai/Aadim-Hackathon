// TopNavbar.js
import React from 'react';
import IsLogin from '../Helper/LoginHook';
import GetUserName from '../Helper/Name';
import './TopNavbar.css'; // make sure this path is correct
import { Link } from 'react-router-dom';

const TopNavbar = () => {
  return (
    <nav className="top-navbar">
      {/* Logo */}
      <Link to="/">  <div className="navbar-logo">
            Poll<span style={{background:"#FFBF00",color:"Black",borderRadius:"2px",padding:"2px",marginLeft:"3.5px"}}>Hub</span>
      </div>
</Link>
      {/* Navigation Links */}
         <Link to="/CreatePolls"><div className="nav-item" >Create</div></Link> 
       <Link to="/Polls"> <div className="nav-item" >Hot Poll</div></Link>
       <Link to="/SearchPolls">  <div className="nav-item" >Search</div></Link>

      {/* User Section */}
      <div className="navbar-user">
        {IsLogin() ? (
         <Link to="/UserPoll"> <span>Hello, <strong>{GetUserName()}</strong></span></Link>
        ) : (
          <Link to="/Login"><div className="nav-item"> Login / Signup</div></Link> 
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
