import React from 'react';
import {createRoot} from 'react-dom/client';
import CalendarApp from './app/calendar-app';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<CalendarApp/>);
