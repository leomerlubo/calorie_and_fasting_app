import React from 'react';
import {createRoot} from 'react-dom/client';
import SupabaseGate from './SupabaseGate.jsx';
import {installKeyboardFix} from './keyboardFix.js';
import './testv3.css';

installKeyboardFix();
createRoot(document.getElementById('root')).render(<React.StrictMode><SupabaseGate/></React.StrictMode>);
