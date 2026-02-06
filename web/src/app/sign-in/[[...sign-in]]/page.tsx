import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-outfit text-4xl font-bold text-emerald-400">
            Prime PenTrix
          </h1>
          <p className="text-slate-400">Sign in to access your AI study platform</p>
        </div>

        {/* Clerk Sign-In Component */}
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-slate-800/50 backdrop-blur-xl shadow-2xl border border-emerald-500/20',
            },
          }}
          routing="path"
          path="/sign-in"
        />

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Built by <span className="text-emerald-400">MIHx0</span> for Howest University 🇧🇪
        </p>
      </div>
    </div>
  );
}
