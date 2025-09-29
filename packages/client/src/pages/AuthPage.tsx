import React, { useState } from 'react';
import bgImage from '@/assets/bg1.jpg';
import { useNavigate } from 'react-router-dom';

interface AuthPageProps {
   setToken?: (token: string | null) => void;
   setUserId?: (userId: string | null) => void; // add this
}

export default function AuthPage({ setToken, setUserId }: AuthPageProps) {
   const navigate = useNavigate();

   const [mode, setMode] = useState<'login' | 'register'>('login');
   const [loading, setLoading] = useState(false);

   const [name, setName] = useState('');
   const [password, setPassword] = useState('');

   const isPasswordValid = /^\d{6}$/.test(password);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isPasswordValid) {
         alert('Password must be exactly 6 digits');
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
            throw new Error(data.message || 'Something went wrong');
         }

         if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);

            setToken?.(data.token);
            setUserId?.(data.userId);

            navigate('/app');
         }
      } catch (err: any) {
         alert(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div
            className="fixed inset-0 bg-cover bg-center opacity-60 -z-10"
            style={{ backgroundImage: `url(${bgImage})` }}
            aria-hidden="true"
         />

         <div className="max-w-md w-full mx-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6">
               {mode === 'login' ? 'Sign In' : 'Register'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700">
                     Username
                  </label>
                  <input
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     type="text"
                     placeholder="Enter username"
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-400 px-3 py-2"
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700">
                     6-digit Password
                  </label>
                  <input
                     value={password}
                     onChange={(e) =>
                        setPassword(
                           e.target.value.replace(/\D/g, '').slice(0, 6)
                        )
                     }
                     type="password"
                     placeholder="••••••"
                     maxLength={6}
                     className={`mt-1 block w-full rounded-md shadow-sm px-3 py-2 ${
                        isPasswordValid
                           ? 'border-gray-300 focus:ring-indigo-400'
                           : 'border-red-400 focus:ring-red-400'
                     }`}
                     required
                  />
                  {!isPasswordValid && password.length > 0 && (
                     <p className="text-sm text-red-600 mt-1">
                        Password must be exactly 6 digits
                     </p>
                  )}
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg px-4 py-2 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
               >
                  {loading
                     ? 'Working...'
                     : mode === 'login'
                       ? 'Sign In'
                       : 'Register'}
               </button>
            </form>

            <div className="pt-4 text-center text-sm">
               {mode === 'login' ? (
                  <button
                     onClick={() => setMode('register')}
                     className="text-indigo-600 hover:underline"
                  >
                     Create an account
                  </button>
               ) : (
                  <button
                     onClick={() => setMode('login')}
                     className="text-indigo-600 hover:underline"
                  >
                     Back to sign in
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
