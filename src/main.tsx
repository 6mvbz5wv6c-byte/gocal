import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from './app/home';
import CalendarApp from './app/calendar-app';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(location.pathname==='/'&&!location.search.includes('event=')?<Home/>:['/fayetteville','/fayetteville/','/admin','/'].includes(location.pathname)?<CalendarApp/>:<main className="location-home"><h1>Location not found.</h1><a href="/">Find a supported city</a></main>);
