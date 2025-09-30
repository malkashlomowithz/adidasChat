import React, { useState } from 'react';
import bgImage from '@/assets/bg1.jpg';
import { useNavigate } from 'react-router-dom';
import icon from '@/assets/bubble.png';

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
   const [gender, setGender] = useState<'boy' | 'girl' | ''>('');
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState<string | null>(null);

   const isPasswordValid = /^\d{6}$/.test(password);

   const colorRGB = 'rgb(110, 85, 200)';

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      setError(null);
      setSuccess(null);

      if (!isPasswordValid) {
         setError('Your secret code must be 6 numbers!');
         return;
      }

      if (mode === 'register' && !gender) {
         setError('Please choose if you are a boy or a girl');
         return;
      }

      setLoading(true);
      try {
         const response = await fetch(`/api/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password, gender }),
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
               setSuccess('Yay! Your account is ready 🎉');
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
      <div className="relative flex items-center justify-center min-h-screen">
         <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
            style={{ backgroundImage: `url(${bgImage})` }}
         />

         <div
            className="max-w-md w-full mx-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-4"
            style={{ border: `4px solid ${colorRGB}` }}
         >
            <div className="text-center mb-6">
               <div className="flex justify-center items-center mb-2">
                  <h1
                     className="text-3xl font-extrabold mr-2"
                     style={{ color: colorRGB }}
                  >
                     Welcome to Ask Me!
                  </h1>
                  <img src={icon} alt="Ask Me Logo" className="h-10 w-10" />
               </div>

               <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                  <strong>Learn, explore, and ask anything!</strong>
                  <br />
                  This smart chat is designed for kids, giving helpful answers
                  for homework and curious minds — always safe and
                  child-friendly.
               </p>
            </div>

            <h2
               className="text-3xl font-extrabold text-center mb-4 "
               style={{ color: colorRGB }}
            >
               {mode === 'login' ? 'Welcome Back! 🧸' : 'Join the Fun 🎉'}
            </h2>
            <p className="text-center text-gray-600 mb-6">
               {mode === 'login'
                  ? 'Enter your secret code to start playing!'
                  : 'Create your magical account ✨'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700">
                     Your Name 🌟
                  </label>
                  <input
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     type="text"
                     placeholder="Type your name"
                     className="mt-1 block w-full rounded-full border-2 border-blue-200 shadow-sm focus:ring-2 focus:ring-pink-300 px-4 py-2 text-lg"
                     required
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700">
                     Your Secret Code 🔐
                  </label>
                  <input
                     value={password}
                     onChange={(e) =>
                        setPassword(
                           e.target.value.replace(/\D/g, '').slice(0, 6)
                        )
                     }
                     type="password"
                     placeholder="6 numbers"
                     maxLength={6}
                     className={`mt-1 block w-full rounded-full border-2 shadow-sm px-4 py-2 text-lg ${
                        isPasswordValid
                           ? 'border-blue-200 focus:ring-pink-300'
                           : 'border-red-300 focus:ring-red-300'
                     }`}
                     required
                  />
                  {!isPasswordValid && password.length > 0 && (
                     <p className="text-sm text-red-600 mt-1">
                        Your code must be exactly 6 numbers!
                     </p>
                  )}
               </div>

               {mode === 'register' && (
                  <div>
                     <p className="block text-sm font-medium text-gray-700 mb-2">
                        Who are you?
                     </p>
                     <div className="flex justify-center gap-6">
                        <label className="flex flex-col items-center cursor-pointer">
                           <input
                              type="radio"
                              name="gender"
                              value="boy"
                              checked={gender === 'boy'}
                              onChange={() => setGender('boy')}
                              className="hidden"
                           />
                           <div
                              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md transition-all ${
                                 gender === 'boy'
                                    ? 'bg-blue-300 ring-4 ring-blue-500'
                                    : 'bg-blue-100 hover:bg-blue-200'
                              }`}
                           >
                              🧒
                           </div>
                           <span className="mt-2 text-sm text-blue-700 font-semibold">
                              Boy
                           </span>
                        </label>

                        <label className="flex flex-col items-center cursor-pointer">
                           <input
                              type="radio"
                              name="gender"
                              value="girl"
                              checked={gender === 'girl'}
                              onChange={() => setGender('girl')}
                              className="hidden"
                           />
                           <div
                              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-md transition-all ${
                                 gender === 'girl'
                                    ? 'bg-pink-300 ring-4 ring-pink-500'
                                    : 'bg-pink-100 hover:bg-pink-200'
                              }`}
                           >
                              👧
                           </div>
                           <span className="mt-2 text-sm text-pink-700 font-semibold">
                              Girl
                           </span>
                        </label>
                     </div>
                  </div>
               )}

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
                  className="w-full rounded-full px-6 py-3 text-lg font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'rgb(174, 155, 237)' }}
                  onMouseEnter={(e) =>
                     (e.currentTarget.style.backgroundColor =
                        'rgb(110, 85, 200)')
                  }
                  onMouseLeave={(e) =>
                     (e.currentTarget.style.backgroundColor =
                        'rgb(174, 155, 237)')
                  }
               >
                  {loading
                     ? 'Working...'
                     : mode === 'login'
                       ? 'Let’s Go 🚀'
                       : 'Create My Account 🎠'}
               </button>
            </form>

            <div className="pt-4 text-center text-sm">
               {mode === 'login' ? (
                  <button
                     onClick={() => setMode('register')}
                     className=" hover:underline font-medium"
                     style={{ color: colorRGB }}
                  >
                     Don’t have an account? Join now 💫
                  </button>
               ) : (
                  <button
                     onClick={() => setMode('login')}
                     className="text-blue-600 hover:underline font-medium"
                  >
                     I already have an account 🏠
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
