import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthShell from './AuthShell.jsx';
import { installKeyboardFix } from './keyboardFix.js';
import './testv3.css';

installKeyboardFix();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthShell />
  </React.StrictMode>,
);
