import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { ApiError } from '../api/http'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().optional(),
})

// Mirrors the rules enforced by auth-service, so most mistakes are caught before the request
const registerSchema = loginSchema
  .extend({
    username: z.string().trim()
      .min(3, 'Username must be 3-50 characters')
      .max(50, 'Username must be 3-50 characters')
      .regex(/^[A-Za-z0-9._-]+$/, "Use only letters, digits, '.', '_' or '-'"),
    password: z.string().min(8, 'Password must be 8-72 characters').max(72, 'Password must be 8-72 characters'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

type AuthFormValues = z.infer<typeof loginSchema>

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const auth = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/contacts'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  })

  // Already signed in, or just signed in successfully: continue to where the user was going
  if (auth.user) return <Navigate to={from} replace />

  const onSubmit = async ({ username, password }: AuthFormValues) => {
    try {
      await (isRegister ? auth.register : auth.login)({ username, password })
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors.username) {
        setError('username', { type: 'server', message: e.fieldErrors.username })
      } else if (e instanceof ApiError && e.fieldErrors.password) {
        setError('password', { type: 'server', message: e.fieldErrors.password })
      } else {
        setError('root', { message: e instanceof Error ? e.message : 'Something went wrong' })
      }
    }
  }

  const field = (name: keyof AuthFormValues, label: string, type: string, autoComplete: string) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        className={errors[name] ? 'invalid' : undefined}
        aria-invalid={!!errors[name]}
        {...register(name)}
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.root && <div className="error-box" role="alert">{errors.root.message}</div>}
          {field('username', 'Username', 'text', 'username')}
          {field('password', 'Password', 'password', isRegister ? 'new-password' : 'current-password')}
          {isRegister && field('confirmPassword', 'Confirm password', 'password', 'new-password')}
          <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

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
