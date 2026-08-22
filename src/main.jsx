import React from 'react';
import { createRoot } from 'react-dom/client';
import TestAppV3 from './TestAppV3.jsx';
import './test-v3.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestAppV3 />
  </React.StrictMode>,
);
