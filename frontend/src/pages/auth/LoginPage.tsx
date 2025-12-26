import type { AxiosError } from 'axios'
import { type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/requests'
import { useToast } from '../../components/feedback/ToastProvider'
import { useAuthStore, selectSetAuth } from '../../store/auth-store'
import { Button } from '../../components/ui/Button'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PiHeartFill } from 'react-icons/pi'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
})

type FormValues = z.infer<typeof schema>

const heroImageStyles: CSSProperties = {
  width: '100%',
  display: 'block',
  objectFit: 'contain',
  padding: '1rem',
  borderRadius: '1.5rem',
  //filter: 'drop-shadow(0 25px 35px rgba(15, 15, 36, 0.35))',
  //WebkitMaskImage: 'radial-gradient(circle at center, rgba(0, 0, 0, 1) 65%, rgba(0, 0, 0, 0) 95%)',
  //maskImage: 'radial-gradient(circle at center, rgba(0, 0, 0, 1) 65%, rgba(0, 0, 0, 0) 95%)',
}

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { push } = useToast()
  const setAuth = useAuthStore(selectSetAuth)
  const currentYear = new Date().getFullYear()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth({ accessToken: data.accessToken, user: { email: data.email, displayName: data.displayName } })
      push({ title: 'Welcome back', tone: 'success' })
      const redirect = (location.state as { from?: Location })?.from?.pathname ?? '/app/dashboard'
      navigate(redirect, { replace: true })
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      push({ title: 'Login failed', description: error.response?.data?.error ?? 'Check your credentials', tone: 'error' })
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values)
  }

  return (
    <div className="main-content" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <img src="/gymtrack-gym-640.png" alt="Weights" style={heroImageStyles} />
        <div className='mt-5' style={{ padding: '0 1.5rem 1.5rem' }}>
          <h2>Sign in</h2>
        <p style={{ color: 'var(--text-muted)' }}>Track your workouts and progress.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="grid" style={{ gap: '1rem', marginTop: '1.5rem' }}>
          <label className="field-group">
            <span>Email</span>
            <input type="email" {...register('email')} />
            {errors.email && <small style={{ color: 'var(--danger)' }}>{errors.email.message}</small>}
          </label>
          <label className="field-group">
            <span>Password</span>
            <input type="password" {...register('password')} />
            {errors.password && <small style={{ color: 'var(--danger)' }}>{errors.password.message}</small>}
          </label>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
          <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
            New here? <Link to="/register">Create an account</Link><br/><i>(Invite only - for now)</i>
          </p>
        </div>
      </div>
      <footer style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
          Created with <PiHeartFill style={{ color: '#f472b6' }} aria-label="love" /> by{' '}
          <a href="https://www.linkedin.com/in/tlaukkanen/" target="_blank" rel="noreferrer">
            Tommi Laukkanen
          </a>
        </p>
        <p style={{ margin: '0.35rem 0 0' }}>© {currentYear} Tommi Laukkanen</p>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem 0' }}>
          <Link to="/">
            <img src="/gymtrack_logo_white_with_dumbbell.svg" alt="GymTrack" style={{ height: '2rem' }} />
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
