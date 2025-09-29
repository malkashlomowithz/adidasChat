import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import MainApp from './App';

export default function AppRouter() {
   const [token, setToken] = useState(localStorage.getItem('token'));
   const [userId, setUserId] = useState(localStorage.getItem('userId'));

   useEffect(() => {
      const handleStorageChange = () => {
         setToken(localStorage.getItem('token'));
         setUserId(localStorage.getItem('userId'));
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
   }, []);

   return (
      <Routes>
         <Route
            path="/"
            element={
               token ? (
                  <Navigate to="/app" />
               ) : (
                  <AuthPage setToken={setToken} setUserId={setUserId} />
               )
            }
         />
         <Route
            path="/app"
            element={
               token ? (
                  <MainApp setToken={setToken} userId={userId} />
               ) : (
                  <Navigate to="/" />
               )
            }
         />
      </Routes>
   );
}
