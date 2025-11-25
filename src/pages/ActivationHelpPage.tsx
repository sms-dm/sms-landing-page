import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiMail, FiAlertCircle, FiCheck, FiLock, FiRefreshCw } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import axios from 'axios';

type HelpReason = 'expired' | 'never_received' | 'not_working' | 'other';

interface VerificationStep {
  email: string;
  verificationCode: string;
  verified: boolean;
}

const ActivationHelpPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'reason' | 'verification' | 'success' | 'error'>('email');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<HelpReason | ''>('');
  const [verification, setVerification] = useState<VerificationStep>({
    email: '',
    verificationCode: '',
    verified: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const MAX_ATTEMPTS = 5;
  const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:3005';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if email exists in system
      const response = await axios.post(`${BACKEND_URL}/api/activation/verify-email`, {
        email
      });

      if (response.data.exists) {
        setStep('reason');
      } else {
        setError('Email not found in our system. Please check your payment confirmation email.');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Unable to verify email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReasonSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Send verification code to email
      const response = await axios.post(`${BACKEND_URL}/api/activation/help`, {
        email,
        reason,
        action: 'send_verification'
      });

      if (response.data.success) {
        setVerification({ ...verification, email });
        setStep('verification');
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please try again in an hour.');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAttempts(attempts + 1);

    try {
      // Verify the code
      const response = await axios.post(`${BACKEND_URL}/api/activation/help`, {
        email,
        reason,
        action: 'verify_code',
        verificationCode: verification.verificationCode
      });

      if (response.data.verified) {
        setVerification({ ...verification, verified: true });
        // Now regenerate the activation code
        await regenerateActivationCode();
      } else {
        if (attempts + 1 >= MAX_ATTEMPTS) {
          setError('Maximum attempts exceeded. Please contact support.');
          setStep('error');
        } else {
          setError(`Invalid code. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.`);
        }
      }
    } catch (err: any) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateActivationCode = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/activation/regenerate`, {
        email,
        reason,
        verificationCode: verification.verificationCode
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'New activation code sent successfully!');
        setStep('success');
      } else {
        throw new Error('Regeneration failed');
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'Maximum regenerations exceeded') {
        setError('Maximum regeneration limit reached. Please contact support.');
        setStep('error');
      } else {
        setError('Failed to regenerate code. Please contact support.');
        setStep('error');
      }
    }
  };

  const reasonOptions = [
    { value: 'expired', label: 'My activation code has expired', icon: FiAlertCircle },
    { value: 'never_received', label: 'I never received my activation code', icon: FiMail },
    { value: 'not_working', label: 'My activation code is not working', icon: FiLock },
    { value: 'other', label: 'Other issue', icon: FiRefreshCw }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-sms-deepBlue">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0096FF10_1px,transparent_1px),linear-gradient(to_bottom,#0096FF10_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Link */}
          <Link
            to="/login"
            className="inline-flex items-center text-sms-lightGray hover:text-sms-neonBlue mb-8 transition-colors"
          >
            <FiChevronLeft className="mr-2" />
            Back to Login
          </Link>

          {/* Help Card */}
          <div className="ai-card">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="inline-block mb-4"
              >
                <div className="relative">
                  <BsRobot className="text-5xl text-sms-neonBlue mx-auto" />
                  <div className="absolute inset-0 blur-2xl bg-sms-neonBlue/20"></div>
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-tech font-bold text-white mb-2">
                ACTIVATION HELP
              </h1>
              <p className="text-sms-mediumGray">
                AI-powered activation assistance system
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* Email Step */}
              {step === 'email' && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-sms-lightGray mb-2">
                      Payment Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sms-mediumGray" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg"
                        placeholder="Enter your payment email"
                      />
                    </div>
                    <p className="mt-2 text-xs text-sms-mediumGray">
                      Enter the email address used during payment
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg ${
                      loading 
                        ? 'bg-sms-electricBlue/50 text-white cursor-not-allowed' 
                        : 'ai-button'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* Reason Step */}
              {step === 'reason' && (
                <motion.div
                  key="reason"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-sms-lightGray mb-4">
                      What issue are you experiencing?
                    </label>
                    <div className="space-y-3">
                      {reasonOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <motion.button
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setReason(option.value as HelpReason)}
                            className={`w-full p-4 rounded-lg border transition-all duration-200 flex items-center space-x-3 ${
                              reason === option.value
                                ? 'border-sms-neonBlue bg-sms-neonBlue/10 text-white'
                                : 'border-sms-electricBlue/30 hover:border-sms-electricBlue/50 text-sms-lightGray'
                            }`}
                          >
                            <Icon className="text-xl" />
                            <span className="text-left">{option.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    onClick={handleReasonSubmit}
                    disabled={loading || !reason}
                    className={`w-full py-4 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg ${
                      loading || !reason
                        ? 'bg-sms-electricBlue/50 text-white cursor-not-allowed' 
                        : 'ai-button'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Verification Step */}
              {step === 'verification' && (
                <motion.form
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerificationSubmit}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <FiMail className="text-4xl text-sms-neonBlue mx-auto mb-3" />
                    <p className="text-sm text-sms-lightGray">
                      We've sent a verification code to
                    </p>
                    <p className="text-white font-semibold">{email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sms-lightGray mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={verification.verificationCode}
                      onChange={(e) => setVerification({ ...verification, verificationCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-sms-deepBlue border border-sms-electricBlue/30 text-white text-center text-xl tracking-widest placeholder-sms-mediumGray focus:border-sms-neonBlue focus:outline-none transition-colors rounded-lg font-mono"
                      placeholder="XXXXXX"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || verification.verificationCode.length < 6}
                    className={`w-full py-4 font-semibold flex items-center justify-center space-x-2 transition-all duration-300 rounded-lg ${
                      loading || verification.verificationCode.length < 6
                        ? 'bg-sms-electricBlue/50 text-white cursor-not-allowed' 
                        : 'ai-button'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Regenerate Code</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <FiCheck className="text-6xl text-green-400 mx-auto" />
                    </motion.div>
                    <div className="absolute inset-0 blur-3xl bg-green-400/20"></div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                    <p className="text-sms-lightGray">{successMessage}</p>
                    <p className="text-sm text-sms-mediumGray mt-2">
                      Check your email for your new activation code
                    </p>
                  </div>

                  <Link
                    to="/login"
                    className="ai-button inline-flex items-center space-x-2"
                  >
                    <span>Return to Login</span>
                  </Link>
                </motion.div>
              )}

              {/* Error Step */}
              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="relative">
                    <FiAlertCircle className="text-6xl text-red-400 mx-auto" />
                    <div className="absolute inset-0 blur-3xl bg-red-400/20"></div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Unable to Process Request</h2>
                    <p className="text-sms-lightGray mb-4">{error}</p>
                    
                    <div className="bg-sms-electricBlue/10 border border-sms-electricBlue/30 rounded-lg p-4 text-left">
                      <p className="text-sm font-semibold text-sms-lightGray mb-2">
                        Please contact support:
                      </p>
                      <p className="text-sm text-sms-mediumGray">
                        Email: support@smartmaintenancesystems.com<br />
                        Phone: +1 (555) 123-4567
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/"
                    className="inline-flex items-center text-sms-lightGray hover:text-sms-neonBlue transition-colors"
                  >
                    <FiChevronLeft className="mr-2" />
                    Back to Home
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-sms-mediumGray/60">
              AI-secured verification • Rate-limited protection • Audit trail enabled
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ActivationHelpPage;