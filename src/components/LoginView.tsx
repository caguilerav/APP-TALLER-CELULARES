/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, UserCheck } from 'lucide-react';
import { User } from '../types';
import BolFixLogo from './BolFixLogo';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Pre-configured accounts for rapid developer preview
  const DEMO_ACCOUNTS = [
    { email: 'admin@taller.com', pass: 'admin123', label: 'Admin', role: 'Administrador' },
    { email: 'recepcion@taller.com', pass: 'recep123', label: 'Sofía', role: 'Recepción' },
    { email: 'carlos@taller.com', pass: 'tech123', label: 'Carlos', role: 'Técnico' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fetch from mockDb manually to keep dependencies clean
    import('../db/mockDb').then(({ mockDb }) => {
      const result = mockDb.login(email, password);
      if (result) {
        onLoginSuccess(result.user);
      } else {
        setError('Credenciales incorrectas. Verifique el correo y la contraseña.');
      }
    });
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoverySuccess(true);
    setTimeout(() => {
      setRecoverySuccess(false);
      setShowRecovery(false);
      setRecoveryEmail('');
    }, 3000);
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        
        {/* Color accent bar at the top */}
        <div className="h-2 bg-[#FACC15] w-full" />

        <div className="p-8">
          {/* Brand Identity Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="w-56 max-w-full drop-shadow-xl mb-1">
              <BolFixLogo className="w-full h-auto" />
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
              Servicio Técnico Especializado & Gestión de Taller
            </p>
          </div>

          {!showRecovery ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 animate-pulse">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                  Usuario (Email)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@taller.com"
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Secondary actions */}
              <div className="flex items-center justify-between text-xs font-medium pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-gray-300 text-[#111111] focus:ring-[#FACC15] cursor-pointer"
                  />
                  <span className="text-gray-600">Recordarme</span>
                </label>
                
                <button
                  id="forgot-password-btn"
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-gray-500 hover:text-[#111111] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Big Touch-Optimized Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full bg-[#111111] hover:bg-black text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[1px] transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Ingresar al Sistema</span>
              </button>

              {/* Demo Quick login links - Highly helpful for testing */}
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-400 block uppercase tracking-widest text-center mb-3">
                  Accesos Rápidos Demo
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      id={`demo-login-${acc.label.toLowerCase()}`}
                      key={acc.email}
                      type="button"
                      onClick={() => fillCredentials(acc.email, acc.pass)}
                      className="p-2.5 bg-gray-50 hover:bg-[#FACC15]/10 border border-gray-200 hover:border-[#FACC15] rounded-xl text-left transition-all"
                    >
                      <p className="text-xs font-bold text-[#111111]">{acc.label}</p>
                      <p className="text-[10px] text-gray-500 truncate">{acc.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            // Password Recovery Drawer
            <form onSubmit={handleRecoverySubmit} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#111111]">Recuperar Contraseña</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa tu correo registrado y te enviaremos instrucciones de restablecimiento.
                </p>
              </div>

              {recoverySuccess && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-medium border border-green-100 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Enlace de recuperación enviado con éxito.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="recovery-email-input"
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="tucorreo@taller.com"
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <button
                  id="recovery-submit-btn"
                  type="submit"
                  className="w-full bg-[#111111] text-white font-semibold py-3.5 px-4 rounded-2xl transition-all hover:bg-black text-sm"
                >
                  Enviar Instrucciones
                </button>
                <button
                  id="recovery-cancel-btn"
                  type="button"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoverySuccess(false);
                  }}
                  className="w-full py-2 px-4 rounded-xl text-xs font-medium text-gray-500 hover:text-[#111111] transition-colors"
                >
                  Regresar al Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-gray-400 space-y-1 max-w-sm px-4 leading-relaxed">
        <p>Este sistema de demostración almacena información localmente.</p>
        <p>© 2026 BOL.FIX. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
