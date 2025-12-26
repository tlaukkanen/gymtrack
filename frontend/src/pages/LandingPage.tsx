import { Link } from 'react-router-dom'
import {
  Box,
  Chip,
  Container,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Dumbbell,
  CalendarDays,
  Play,
  BarChart3,
  Target,
  Smartphone,
} from 'lucide-react'
import { PiHeartFill } from 'react-icons/pi'
import { Button } from '../components/ui/Button'

const features = [
  {
    icon: Dumbbell,
    title: 'Build Custom Programs',
    description:
      'Create personalized workout programs with your favorite exercises. Set reps, sets, and rest times for each movement.',
  },
  {
    icon: CalendarDays,
    title: 'Training Diary',
    description:
      'Keep track of every session with a visual calendar. Spot training gaps and maintain consistency over time.',
  },
  {
    icon: Play,
    title: 'Guided Workouts',
    description:
      'Execute your workouts with built-in rest timers, rep tracking, and real-time progress indicators.',
  },
  {
    icon: BarChart3,
    title: 'Muscle Map Analysis',
    description:
      'Visualize which muscles you have trained with an interactive muscle engagement map. Ensure balanced development.',
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description:
      'Monitor weight lifted, sets completed, and workout duration. See your gains over weeks and months.',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description:
      'Install GymTrack as a PWA on your phone. Log workouts even without an internet connection.',
  },
]

const screenshots = [
  { src: '/screens/gymtrack_phone_screenshot_0.png', alt: 'Dashboard view' },
  { src: '/screens/gymtrack_phone_screenshot_1.png', alt: 'Workout execution' },
  { src: '/screens/gymtrack_phone_screenshot_2.png', alt: 'Exercise logging' },
  { src: '/screens/gymtrack_phone_screenshot_3.png', alt: 'Training diary' },
  { src: '/screens/gymtrack_phone_screenshot_4.png', alt: 'Muscle map analysis' },
  { src: '/screens/gymtrack_phone_screenshot_5.png', alt: 'Program builder' },
]

const LandingPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const currentYear = new Date().getFullYear()

  return (
    <Box className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <Box
        component="header"
        className="relative overflow-hidden"
        sx={{
          background:
            'linear-gradient(to bottom, rgba(15,15,15,0.85), rgba(15,15,15,0.95)), url(/gymtrack-gym-640.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack spacing={3} maxWidth={560}>
              <Box>
                <img
                  src="/gymtrack_logo_white_with_dumbbell.svg"
                  alt="GymTrack"
                  style={{ height: 48 }}
                />
              </Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.25rem', md: '3rem' },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: 'white',
                }}
              >
                Your Personal
                <br />
                <span className="text-brand">Workout Companion</span>
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem' }}
              >
                Build programs, execute guided workouts, track progress, and
                analyze muscle engagement — all in one beautiful app.
              </Typography>
              <Stack direction="row" spacing={2} pt={1}>
                <Link to="/login">
                  <Button size="large">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="large">
                    Create Account
                  </Button>
                </Link>
              </Stack>
              <Chip
                label="🎟️ Invite Only — Limited Beta"
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: 'rgba(249,115,22,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(249,115,22,0.4)',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                }}
              />
            </Stack>

            {/* Hero phone mockups - overlapping */}
            <Box
              className="relative hidden md:block"
              sx={{ flexShrink: 0, width: 340, height: 420 }}
            >
              <img
                src="/screens/gymtrack_phone_screenshot_1.png"
                alt="GymTrack Workout"
                className="absolute rounded-2xl shadow-2xl"
                style={{
                  width: 220,
                  top: 40,
                  left: 0,
                  transform: 'rotate(-6deg)',
                  zIndex: 1,
                }}
              />
              <img
                src="/screens/gymtrack_phone_screenshot_0.png"
                alt="GymTrack Dashboard"
                className="absolute rounded-2xl shadow-2xl"
                style={{
                  width: 220,
                  top: 0,
                  right: 0,
                  transform: 'rotate(4deg)',
                  zIndex: 2,
                }}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={6} alignItems="center">
          <Stack spacing={1} textAlign="center" maxWidth={600}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 700, color: 'white', fontSize: { xs: '1.75rem', md: '2.25rem' } }}
            >
              Everything You Need to Train Smarter
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
              GymTrack combines workout planning, execution, and analysis into one
              seamless experience.
            </Typography>
          </Stack>

          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
            gap={3}
            width="100%"
          >
            {features.map((feature) => (
              <Box
                key={feature.title}
                className="rounded-2xl bg-slate-800/60 p-6 transition-colors hover:bg-slate-800"
                sx={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Stack spacing={2}>
                  <Box
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/20"
                    sx={{ color: 'var(--brand)' }}
                  >
                    <feature.icon size={24} />
                  </Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
                    {feature.description}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Box>
        </Stack>
      </Container>

      {/* Screenshots Gallery */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'rgba(0,0,0,0.25)' }}>
        <Container maxWidth="lg">
          <Stack spacing={5} alignItems="center">
            <Stack spacing={1} textAlign="center" maxWidth={600}>
              <Typography
                variant="h2"
                sx={{ fontWeight: 700, color: 'white', fontSize: { xs: '1.75rem', md: '2.25rem' } }}
              >
                See It in Action
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                A clean, intuitive interface designed for the gym floor.
              </Typography>
            </Stack>

            <Box
              className="flex gap-4 overflow-x-auto pb-4"
              sx={{
                width: '100%',
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 4 },
              }}
            >
              {screenshots.map((shot, index) => (
                <Box
                  key={index}
                  className="flex-shrink-0 scroll-snap-align-start"
                  sx={{ width: isMobile ? 200 : 240 }}
                >
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    className="rounded-md shadow-xl"
                    style={{ width: '100%' }}
                  />
                </Box>
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack
          spacing={3}
          alignItems="center"
          textAlign="center"
          className="rounded-3xl bg-gradient-to-br from-brand/20 to-brand/5 p-8"
          sx={{ border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: 'white', fontSize: { xs: '1.5rem', md: '2rem' } }}
          >
            Ready to Level Up Your Training?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Join GymTrack today and start building your best physique.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Link to="/register">
              <Button size="large">Get Started Free</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="large">
                Sign In
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Container>

      {/* Footer */}
      <Box component="footer" sx={{ py: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center">
            <img
              src="/gymtrack_logo_white_with_dumbbell.svg"
              alt="GymTrack"
              style={{ height: 28 }}
            />
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              Created with <PiHeartFill style={{ color: '#f472b6' }} /> by{' '}
              <a
                href="https://www.linkedin.com/in/tlaukkanen/"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Tommi Laukkanen
              </a>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              © {currentYear} Tommi Laukkanen. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage
