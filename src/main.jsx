import React from 'react';
import { createRoot } from 'react-dom/client';
import TestApp from './TestApp.jsx';
import './test.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
);
