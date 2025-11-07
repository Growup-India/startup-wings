import { lazy } from 'react';

// Lazy load components for code splitting
export const About = lazy(() => import('./components/About'));
export const Features = lazy(() => import('./components/Features'));
export const Services = lazy(() => import('./components/Services'));
export const Contact = lazy(() => import('./components/Contact'));
export const UserDashboard = lazy(() => import('./components/UserDashboard'));