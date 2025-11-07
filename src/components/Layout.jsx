import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="full-width-container">
      <Sidebar />
      <div className="content-area">
        {children}
      </div>
    </div>
  );
};

export default Layout;