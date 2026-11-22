import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { showSubmitError } from '../lib/formErrors'

// ---------------------------------------------------------------- validation rules

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().optional(),   // only shown (and checked) when registering
})

// Registering is stricter. These rules mirror the ones auth-service enforces,
// so most mistakes are caught before any request is sent.
const registerSchema = loginSchema
  .extend({
    username: z.string().trim()
      .min(3, 'Username must be 3-50 characters')
      .max(50, 'Username must be 3-50 characters')
      .regex(/^[A-Za-z0-9._-]+$/, "Use only letters, digits, '.', '_' or '-'"),
    password: z.string().min(8, 'Password must be 8-72 characters').max(72, 'Password must be 8-72 characters'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],   // show the message under the "Confirm password" input
    message: 'Passwords do not match',
  })

/** The form's values: { username, password, confirmPassword? }, generated from the rules above. */
type AuthFormValues = z.infer<typeof loginSchema>

/** The form's inputs in on-screen order (used to place server errors under the right input). */
const FIELDS = ['username', 'password', 'confirmPassword'] as const

type Mode = 'login' | 'register'

// ---------------------------------------------------------------- page

/** The "Sign in" page (`mode="login"`) and the "Create an account" page (`mode="register"`). */
export function AuthPage({ mode }: { mode: Mode }) {
  // `key` makes React build a brand-new form when the mode changes. Without it, React would reuse the
  // same form when you click "Create an account" on the sign-in page, keeping what you typed and any errors.
  return <AuthForm key={mode} mode={mode} />
}

function AuthForm({ mode }: { mode: Mode }) {
  const isRegister = mode === 'register'
  const auth = useAuth()

  // Where to go after signing in. RequireAuth puts the page you originally asked for in `state.from`
  // (e.g. "/contacts/5"); if you came to this page directly, go to the contact list.
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/contacts'

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  })

  // Already signed in, or just signed in successfully: continue to where the user was going.
  // (After a successful login, AuthProvider updates `auth.user`, React re-renders this page, and this line redirects.)
  // Note: React requires every hook (`use...`) to run before an early `return` like this one.
  if (auth.user) return <Navigate to={from} replace />

  // Only called when the values pass the rules above (handleSubmit checks them first).
  const onSubmit = async ({ username, password }: AuthFormValues) => {
    try {
      const signIn = isRegister ? auth.register : auth.login
      await signIn({ username, password })
    } catch (error) {
      const firstInvalid = showSubmitError(error, FIELDS, setError)
      if (firstInvalid) setFocus(firstInvalid)
    }
  }

  /** One labelled input, with its error message underneath. */
  const field = (name: keyof AuthFormValues, label: string, type: 'text' | 'password', autoComplete: string) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        className={errors[name] ? 'invalid' : undefined}
        aria-invalid={!!errors[name]}
        {...register(name)}   // connects the input to the form: adds name, onChange, onBlur and ref
      />
      {errors[name] && <p className="error">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <main className="auth-page">
      <div className="auth-card card">
        <div className="brand auth-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill="currentColor" />
          </svg>
          Contact Manager
        </div>
        <h1>{isRegister ? 'Create an account' : 'Sign in'}</h1>

        {/* noValidate: skip the browser's own validation popups; the rules above show nicer messages */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.root && <div className="error-box" role="alert">{errors.root.message}</div>}

          {field('username', 'Username', 'text', 'username')}
          {/* autoComplete tells password managers whether to fill in a saved password or suggest a new one */}
          {field('password', 'Password', 'password', isRegister ? 'new-password' : 'current-password')}
          {isRegister && field('confirmPassword', 'Confirm password', 'password', 'new-password')}

          <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Pass `from` along, so switching between the two pages doesn't forget where the user was going */}
        <p className="muted auth-switch">
          {isRegister ? (
            <>Already have an account? <Link to="/login" state={{ from }}>Sign in</Link></>
          ) : (
            <>New here? <Link to="/register" state={{ from }}>Create an account</Link></>
          )}
        </p>
      </div>
    </main>
  )
}
