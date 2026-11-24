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
    <div id="login-container" className="min-h-screen bg-[#0D0D10] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle geometric tech grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(rgba(250, 204, 21, 0.22) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[240px] bg-[#FACC15]/10 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] border border-white/15 overflow-hidden relative z-10 animate-scale-up">
        
        {/* Precision top hardware accent bar */}
        <div className="h-1.5 bg-[#FACC15] w-full" />

        {/* Dark Carbon Brand Header Strip */}
        <div className="apk-dark-panel px-7 pt-7 pb-6 text-center flex flex-col items-center border-b border-white/10">
          <div className="w-52 max-w-full drop-shadow-xl mb-1.5">
            <BolFixLogo className="w-full h-auto" />
          </div>
          <p className="font-display text-[11px] font-semibold text-gray-300 mt-1 uppercase tracking-[0.14em]">
            Servicio Técnico Especializado & Gestión de Taller
          </p>
        </div>

        <div className="p-6 sm:p-7 bg-white">
          {!showRecovery ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="font-display text-[11px] font-bold text-gray-700 block uppercase tracking-wider">
                  Usuario (Email)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-gray-400" />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@taller.com"
                    className="apk-input block w-full min-h-[46px] pl-11 pr-4 py-3 text-sm font-medium text-[#111111]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="font-display text-[11px] font-bold text-gray-700 block uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-gray-400" />
                  </span>
                  <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="apk-input block w-full min-h-[46px] pl-11 pr-4 py-3 text-sm font-medium text-[#111111]"
                  />
                </div>
              </div>

              {/* Secondary actions */}
              <div className="flex items-center justify-between text-xs font-medium pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none min-h-[36px]">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-gray-300 accent-[#111111] cursor-pointer"
                  />
                  <span className="text-gray-700 font-medium">Recordarme</span>
                </label>
                
                <button
                  id="forgot-password-btn"
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-gray-500 hover:text-[#111111] font-semibold transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Big Touch-Optimized Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full min-h-[48px] bg-[#111111] hover:bg-black text-[#FACC15] font-display font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl apk-chamfer-sm shadow-lg hover:shadow-xl active:scale-[0.985] transition-all duration-150 flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
              </button>

              {/* Demo Quick login links */}
              <div className="pt-4 border-t border-gray-200">
                <span className="font-display text-[10px] font-bold text-gray-400 block uppercase tracking-[0.16em] text-center mb-2.5">
                  Accesos Rápidos Demo
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      id={`demo-login-${acc.label.toLowerCase()}`}
                      key={acc.email}
                      type="button"
                      onClick={() => fillCredentials(acc.email, acc.pass)}
                      className="min-h-[52px] p-2.5 bg-[#F6F7F9] hover:bg-[#111111] hover:text-white border border-gray-200 hover:border-[#111111] rounded-xl text-left transition-all duration-150 cursor-pointer group active:scale-95"
                    >
                      <p className="font-display text-xs font-bold text-[#111111] group-hover:text-[#FACC15]">{acc.label}</p>
                      <p className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate">{acc.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            // Password Recovery Drawer
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="text-center mb-3">
                <h2 className="font-display text-lg font-bold text-[#111111] uppercase tracking-wide">Recuperar Contraseña</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa tu correo registrado y te enviaremos instrucciones de restablecimiento.
                </p>
              </div>

              {recoverySuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Enlace de recuperación enviado con éxito.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-display text-[11px] font-bold text-gray-700 block uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-gray-400" />
                  </span>
                  <input
                    id="recovery-email-input"
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="tucorreo@taller.com"
                    className="apk-input block w-full min-h-[46px] pl-11 pr-4 py-3 text-sm font-medium text-[#111111]"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <button
                  id="recovery-submit-btn"
                  type="submit"
                  className="w-full min-h-[48px] bg-[#111111] text-[#FACC15] font-display font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl apk-chamfer-sm transition-all hover:bg-black active:scale-[0.985] text-sm cursor-pointer"
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
                  className="w-full min-h-[40px] py-2 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Regresar al Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-gray-500 space-y-1 max-w-sm px-4 leading-relaxed relative z-10">
        <p>Este sistema de demostración almacena información localmente.</p>
        <p className="font-mono text-[11px] text-gray-400">© 2026 BOL.FIX. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
