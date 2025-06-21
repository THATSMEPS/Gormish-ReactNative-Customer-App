
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// import type { Auth } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface SignupProps {
  onSignupSuccess: () => void;
  onCancel: () => void;
  isOpen?: boolean;
};

export const Signup = ({ onSignupSuccess, onCancel, isOpen }: SignupProps) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  useEffect(() => {
    if (isOpen) {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
            },
          },
          
        );
      }
    }
    // Cleanup on unmount or when isOpen becomes false
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSendOtp = async () => {
    setErrorMessage('');
    if (!name.trim() || !email.trim() || !validatePhone(phone)) {
      setErrorMessage('Please enter valid name, email, and 10-digit phone number.');
      return;
    }
    setIsLoading(true);
    try {
      // Check if phone exists
      // const formattedPhone = countryCode + phone;
      const response = await fetch(`${API_BASE_URL}/auth/phoneexist?phone=${phone}`);
      const data = await response.json();
      if (data.success && data.data && data.data.phone_exist === false) {
        // Send OTP via Firebase SDK
        if (!recaptchaVerifierRef.current) {
          setErrorMessage('reCAPTCHA not initialized. Please try again.');
          setIsLoading(false);
          return;
        }
        const appVerifier = recaptchaVerifierRef.current;
        // const formattedPhone = countryCode + phone;
        const result = await signInWithPhoneNumber(auth, phone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
      } else if (data.success && data.data && data.data.phone_exist === true) {
        setErrorMessage('Phone number already registered. Please login.');
      } else {
        setErrorMessage('Failed to check phone number. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage('Please enter a valid 6-digit OTP.');
      return;
    }
    if (!confirmationResult) {
      setErrorMessage('No OTP request found. Please request OTP again.');
      return;
    }
    setIsLoading(true);
    try {
      // const result = await confirmationResult.confirm(otp);
      // const idToken = await result.user.getIdToken();

      // Complete registration
      const body = {
        name,
        email,
        phone: phone,}
        console.log('body', body);
        console.log('string body', JSON.stringify(body));

      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body : JSON.stringify(body)
        // body: { name, email, formattedPhone: countryCode + phone },
      });
     
      const registerData = await registerResponse.json();
      if (registerResponse.ok && registerData.success) {
        onSignupSuccess();
      } else {
        setErrorMessage(registerData.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div id="recaptcha-container"></div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#6552FF]/80 backdrop-blur-xl rounded-[30px] p-8 w-full max-w-md text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20"
              style={{
                WebkitBackdropFilter: 'blur(8px)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold mb-6">
                  Signup
                </h2>
                <div className="space-y-6 flex flex-col items-center">
                  {!otpSent ? (
                    <>
                      <div className="flex items-center w-full max-w-sm mb-3 rounded-full border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden bg-white">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-white text-black rounded-l-full px-4 py-2 outline-none cursor-pointer border-r border-gray-300"
                          aria-label="Select country code"
                        >
                          <option value="+91">🇮🇳 +91</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                          className="flex-grow p-2 rounded-r-full border-none text-black focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full mb-3 p-2 rounded-full border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mb-3 p-2 rounded-full border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {errorMessage && <p className="text-red-500 mb-3">{errorMessage}</p>}
                      <button
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-1/2 mx-auto bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
                      >
                        {isLoading ? 'Sending OTP...' : 'Complete Signup'}
                      </button>
                      <button
                        onClick={onCancel}
                        className="w-full mt-2 text-center text-white underline"
                      >
                        Back to Login
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mb-3">Enter the 6-digit OTP sent to {email}</p>
                      <div className="flex justify-center space-x-4 mb-3">
                        {[...Array(6)].map((_, index) => (
                          <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-10 border-b-2 border-white/70 bg-transparent text-black text-center text-lg focus:outline-none focus:border-indigo-600"
                            value={otp[index] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (!val) return;
                              const newOtp = otp.split('');
                              newOtp[index] = val[0];
                              setOtp(newOtp.join('').slice(0, 6));
                              // Move focus to next input
                              const nextInput = e.target.nextElementSibling as HTMLInputElement | null;
                              if (nextInput) nextInput.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                const target = e.target as HTMLInputElement;
                                const prevInput = target.previousElementSibling as HTMLInputElement | null;
                                if (prevInput) prevInput.focus();
                              }
                            }}
                          />
                        ))}
                      </div>
                      {errorMessage && <p className="text-red-500 mb-3">{errorMessage}</p>}
                      <button
                        onClick={handleVerifyOtp}
                        disabled={isLoading}
                        className="w-1/2 mx-auto bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
                      >
                        {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
                      </button>
                      <button
                        onClick={onCancel}
                        className="w-full mt-2 text-center text-white underline"
                      >
                        Back to Login
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
