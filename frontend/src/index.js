import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import { Home } from './components';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);