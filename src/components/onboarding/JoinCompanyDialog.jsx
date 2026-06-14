// JoinCompanyDialog — code-only "join an existing company" modal (frontend mock).
// Joining always produces a team MEMBER; the owner can promote to admin later.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Building2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { verifyCompanyCode, joinCompanyByCode } from '../../lib/companyJoinMock';

export default function JoinCompanyDialog({ open, onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState(null); // verified company awaiting confirm
  const [joining, setJoining] = useState(false);

  const reset = () => {
    setCode('');
    setError('');
    setResolved(null);
    setVerifying(false);
    setJoining(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleVerify = async () => {
    if (!code.trim() || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const result = await verifyCompanyCode(code);
      if (result.ok) {
        setResolved(result.company);
      } else {
        setError('Code cannot be verified');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!resolved || joining) return;
    setJoining(true);
    const result = await joinCompanyByCode(code);
    setJoining(false);
    if (!result.ok) {
      setError('Could not join. Please check the code and try again.');
      setResolved(null);
      return;
    }
    const company = resolved;
    reset();
    onJoined(company);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed left-1/2 top-1/2 z-[65] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="relative rounded-2xl bg-white shadow-xl p-6">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <div className="text-center mb-5">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                  <Building2 className="h-5 w-5 text-brand" />
                </div>
                <h2 className="text-lg font-semibold">Join your company</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the company code from your account owner.
                </p>
              </div>

              {!resolved ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-code">Company code</Label>
                    <Input
                      id="company-code"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (error) setError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                      className={error ? 'border-red-500' : ''}
                      autoFocus
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={!code.trim() || verifying}
                    className="w-full"
                  >
                    {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{resolved.name}</p>
                      <p className="text-xs text-emerald-700">
                        {resolved.domain} · {resolved.industry}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        You'll join as a team member.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setResolved(null)} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleConfirmJoin} disabled={joining} className="flex-1">
                      {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Join {resolved.name}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
