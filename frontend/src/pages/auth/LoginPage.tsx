import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/requests'
import { useToast } from '../../components/feedback/ToastProvider'
import { useAuthStore, selectSetAuth } from '../../store/auth-store'
import { Button } from '../../components/ui/Button'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
})

type FormValues = z.infer<typeof schema>

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { push } = useToast()
  const setAuth = useAuthStore(selectSetAuth)
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
    onError: (error: any) => {
      push({ title: 'Login failed', description: error.response?.data?.error ?? 'Check your credentials', tone: 'error' })
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values)
  }

  return (
    <div className="main-content" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card">
        <h2>Sign in</h2>
        <p style={{ color: 'var(--text-muted)' }}>Access your GymTrack programs and sessions.</p>
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
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
