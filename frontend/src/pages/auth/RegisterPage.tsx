import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/requests'
import { useToast } from '../../components/feedback/ToastProvider'
import { useAuthStore, selectSetAuth } from '../../store/auth-store'
import { Button } from '../../components/ui/Button'
import { Link, useNavigate } from 'react-router-dom'

const schema = z
  .object({
    displayName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    invitationCode: z.string().min(1, 'Invitation code is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

const RegisterPage = () => {
  const navigate = useNavigate()
  const { push } = useToast()
  const setAuth = useAuthStore(selectSetAuth)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '', invitationCode: '' },
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth({ accessToken: data.accessToken, user: { email: data.email, displayName: data.displayName } })
      push({ title: 'Welcome to GymTrack', tone: 'success' })
      navigate('/app/dashboard', { replace: true })
    },
    onError: (error: any) => {
      push({ title: 'Registration failed', description: error.response?.data?.error ?? 'Try a different email', tone: 'error' })
    },
  })

  const onSubmit = (values: FormValues) => {
    const { confirmPassword, ...payload } = values
    mutation.mutate(payload)
  }

  return (
    <div className="main-content" style={{ maxWidth: 440, margin: '0 auto' }}>
      <div className="card">
        <h2>Create your account</h2>
        <p style={{ color: 'var(--text-muted)' }}>Define programs, track sessions, and stay consistent.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="grid" style={{ gap: '1rem', marginTop: '1.5rem' }}>
          <label className="field-group">
            <span>Display name</span>
            <input {...register('displayName')} />
            {errors.displayName && <small style={{ color: 'var(--danger)' }}>{errors.displayName.message}</small>}
          </label>
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
          <label className="field-group">
            <span>Confirm password</span>
            <input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <small style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</small>}
          </label>
          <label className="field-group">
            <span>Invitation code</span>
            <input {...register('invitationCode')} />
            {errors.invitationCode && <small style={{ color: 'var(--danger)' }}>{errors.invitationCode.message}</small>}
          </label>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
