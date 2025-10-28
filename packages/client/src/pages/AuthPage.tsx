import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import icon from '@/assets/12345.png';

interface AuthPageProps {
   setToken?: (token: string | null) => void;
   setUserId?: (userId: string | null) => void;
}

export default function AuthPage({ setToken, setUserId }: AuthPageProps) {
   const navigate = useNavigate();

   const [mode, setMode] = useState<'login' | 'register'>('login');
   const [loading, setLoading] = useState(false);
   const [name, setName] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);

   const isPasswordValid = /^\d{6}$/.test(password);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      setError(null);
      setSuccess(null);

      if (!isPasswordValid) {
         setError('Your secret code must be 6 numbers!');
         return;
      }

      setLoading(true);
      try {
         const response = await fetch(`/api/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password }),
         });

         const data = await response.json();

         if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
         }

         if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            setToken?.(data.token);
            setUserId?.(data.userId);

            if (mode === 'register') {
               setSuccess('Account created successfully');
            }

            navigate('/app');
         }
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="relative flex items-center justify-center min-h-screen bg-gray-50">
         <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow p-8">
            <div className="flex justify-center mb-6">
               <img src={icon} alt="Ask Me Logo" className="h-25 w-auto" />
            </div>

            <div className="text-center mb-8">
               <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
               </h1>
               <p className="text-sm text-gray-600">
                  {mode === 'login'
                     ? 'Sign in to continue'
                     : 'Join Ask Me today'}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                     Name
                  </label>
                  <input
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     type="text"
                     placeholder="Enter your name"
                     className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                     Secret Code
                  </label>
                  <input
                     value={password}
                     onChange={(e) =>
                        setPassword(
                           e.target.value.replace(/\D/g, '').slice(0, 6)
                        )
                     }
                     type="password"
                     placeholder="6 digits"
                     maxLength={6}
                     className={`mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring-1 ${
                        isPasswordValid
                           ? 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                           : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                     }`}
                     required
                  />
                  {!isPasswordValid && password.length > 0 && (
                     <p className="text-xs text-red-600 mt-1.5">
                        Must be exactly 6 numbers
                     </p>
                  )}
               </div>

               {error && (
                  <p className="text-sm text-red-600 text-center font-medium">
                     {error}
                  </p>
               )}

               {success && (
                  <p className="text-sm text-green-600 text-center font-medium">
                     {success}
                  </p>
               )}

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded border border-gray-900 bg-gray-900 px-6 py-2.5 font-medium text-white hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50"
               >
                  {loading
                     ? 'Loading...'
                     : mode === 'login'
                       ? 'Sign In'
                       : 'Create Account'}
               </button>
            </form>

            <div className="mt-6 text-center text-sm">
               {mode === 'login' ? (
                  <button
                     onClick={() => setMode('register')}
                     className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                     Don't have an account? Sign up
                  </button>
               ) : (
                  <button
                     onClick={() => setMode('login')}
                     className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                     Already have an account? Sign in
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
