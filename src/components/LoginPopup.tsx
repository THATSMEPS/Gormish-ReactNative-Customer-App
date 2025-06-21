declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';

import { auth } from '../firebase';
// import type { Auth } from 'firebase/auth';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
  embedded?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gormishbackend.onrender.com/api';

export const LoginPopup = ({ isOpen, onClose, onSignupClick }: Props) => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  useEffect(() => {
    if (isOpen) {
      // Initialize reCAPTCHA verifier when popup opens
      // Always re-initialize to avoid stale element reference
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow send OTP
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            // Reset reCAPTCHA?
            console.log('reCAPTCHA expired');
          },
        },
        // auth as Auth
      );
    } else {
      // Cleanup recaptchaVerifier when popup closes
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [isOpen]);

  const handleSendOtp = async () => {
    setErrorMessage('');
    if (!validatePhone(phone)) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    setIsLoading(true);
    try {
      // Check if phone exists
      // const formattedPhone = countryCode + phone;
      const response = await fetch(`${API_BASE_URL}/auth/phoneexist?phone=${phone}`);
      const data = await response.json();
      if (data.success && data.data && data.data.phone_exist === true) {
        // Send OTP via Firebase
        const appVerifier = window.recaptchaVerifier;
        // const formattedPhone = countryCode + phone; // Adjust country code as needed
        const result = await signInWithPhoneNumber(auth, phone, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
      } else if (data.success && data.data && data.data.phone_exist === false) {
        setErrorMessage('Phone number not registered. Please signup first.');
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
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // Send Firebase ID token to backend for verification
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-firebase-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const verifyData = await verifyResponse.json();
      if (verifyResponse.ok && verifyData.success) {
        // Save authToken and user info to localStorage
        if (verifyData.data && verifyData.data.session && verifyData.data.session.authToken) {
          localStorage.setItem('authToken', verifyData.data.session.authToken);
          if (verifyData.data.session.expires_at) {
            localStorage.setItem('expiresAt', verifyData.data.session.expires_at.toString());
          }
        }
        if (verifyData.data && verifyData.data.user) {
          localStorage.setItem('customerData', JSON.stringify(verifyData.data.user));
          // Store customerId separately in localStorage
          if (verifyData.data.user.id) {
            localStorage.setItem('customerId', verifyData.data.user.id);
          }
        }
        // Login success, close popup
        onClose();
      } else {
        setErrorMessage(verifyData.message || 'OTP verification failed. Please try again.');
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
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-none"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#6552FF]/80 backdrop-blur-none rounded-[30px] p-6 w-full max-w-sm text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20"
            style={{
              WebkitBackdropFilter: 'none',
              backdropFilter: 'none',
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-6">
                Login To Order
              </h2>

              <div className="space-y-4 flex flex-col items-center">
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
                    {errorMessage && (
                      <>
                        <p className="text-white/70 mb-3">{errorMessage}</p>
                      </>
                    )}
                    <button
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-1/2 mx-auto bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                    <div id="recaptcha-container"></div>
                    <p className="mt-2 text-center text-sm text-white">
                      <span className="mr-3">or</span>
                      <span
                        className="text-white font-bold text-lg cursor-pointer hover:underline"
                        onClick={onSignupClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onSignupClick();
                          }
                        }}
                      >
                        create an account
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center space-x-4 mb-3">
                      {[...Array(6)].map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-10 border-b-2 border-white/70 bg-transparent text-white text-center text-lg focus:outline-none focus:border-white"
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
                      className="w-1/2 mx-auto bg-indigo-600 text-white py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
                    </button>
                  </>
                )}
              </div>

              <p className="text-sm text-center mt-6 text-white/70">
                By Signing In You Are Agreeing Our Terms & Conditions And Privacy Policies
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
