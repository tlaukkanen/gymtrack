import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Pagination,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { sessionsApi } from '../../api/requests'
import { formatDateTime } from '../../utils/time'
import type { PagedResult, SessionListStatus, WorkoutSessionSummaryDto } from '../../types/api'

const SESSION_STATUS_OPTIONS: Array<{ value: SessionListStatus; label: string }> = [
  { value: 'All', label: 'All sessions' },
  { value: 'InProgress', label: 'In progress' },
  { value: 'Completed', label: 'Completed' },
]

const PAGE_SIZE = 10

const parsePageNumber = (value: string | null) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
}

const formatDuration = (value?: string | null) => {
  if (!value) return '—'
  const [hours = '0', minutes = '0', secondsPart = '0'] = value.split(':')
  const hoursNum = Number(hours)
  const minutesNum = Number(minutes)
  const secondsNum = Math.round(Number(secondsPart))
  const parts: string[] = []
  if (hoursNum > 0) parts.push(`${hoursNum}h`)
  if (minutesNum > 0) parts.push(`${minutesNum}m`)
  if (parts.length === 0) parts.push(`${secondsNum}s`)
  return parts.join(' ')
}

const getStatusLabel = (session: WorkoutSessionSummaryDto) => {
  const inProgress = !session.completedAt
  return {
    label: inProgress ? 'In progress' : 'Completed',
    color: inProgress ? 'warning' : 'success',
  } as const
}

const TrainingDiaryPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const filters = useMemo(() => {
    const statusParam = (searchParams.get('status') as SessionListStatus) ?? 'All'
    const status = SESSION_STATUS_OPTIONS.some((option) => option.value === statusParam) ? statusParam : 'All'

    return {
      status,
      search: searchParams.get('search') ?? '',
      startedFrom: searchParams.get('startedFrom') ?? '',
      startedTo: searchParams.get('startedTo') ?? '',
      page: parsePageNumber(searchParams.get('page')),
      pageSize: Number(searchParams.get('pageSize')) || PAGE_SIZE,
    }
  }, [searchParams])

  const [searchValue, setSearchValue] = useState(filters.search)
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  const updateParams = (mutator: (params: URLSearchParams) => void, resetPage = true) => {
    const next = new URLSearchParams(searchParams)
    mutator(next)
    if (!next.get('pageSize')) {
      next.set('pageSize', filters.pageSize.toString())
    }
    if (resetPage) {
      next.set('page', '1')
    } else if (!next.get('page')) {
      next.set('page', '1')
    }
    setSearchParams(next, { replace: true })
  }

  const applySearch = (value: string) => {
    const trimmed = value.trim()
    updateParams((params) => {
      if (trimmed) {
        params.set('search', trimmed)
      } else {
        params.delete('search')
      }
    })
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applySearch(searchValue)
  }

  const handleStatusChange = (_: unknown, value: SessionListStatus | null) => {
    if (!value) return
    updateParams((params) => {
      if (value === 'All') {
        params.delete('status')
      } else {
        params.set('status', value)
      }
    })
  }

  const handleDateChange = (key: 'startedFrom' | 'startedTo', value: string) => {
    updateParams((params) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    next.set('page', '1')
    next.set('pageSize', filters.pageSize.toString())
    setSearchParams(next, { replace: true })
  }

  const handlePageChange = (_: unknown, value: number) => {
    updateParams((params) => {
      params.set('page', String(value))
    }, false)
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.startedFrom ||
      filters.startedTo ||
      filters.status !== 'All'
  )

  const listQuery = useQuery<PagedResult<WorkoutSessionSummaryDto>>({
    queryKey: ['sessions', 'list', filters],
    queryFn: () =>
      sessionsApi.list({
        page: filters.page,
        pageSize: filters.pageSize,
        status: filters.status,
        search: filters.search || undefined,
        startedFrom: filters.startedFrom || undefined,
        startedTo: filters.startedTo || undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  const sessions: WorkoutSessionSummaryDto[] = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / filters.pageSize))

  const filterCardPadding = isMobile && !isFilterExpanded ? 2 : 3
  const filterStackSpacing = isMobile && !isFilterExpanded ? 1.5 : 2

  return (
    <Stack spacing={3}>
      <div className="section-header">
        <div>
          <Typography variant="h2">Training Diary</Typography>
          <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>Review recent workouts, resume active sessions, and spot gaps.</p>
        </div>
        <Button onClick={() => navigate('/app/dashboard')}
          fullWidth={isMobile}
          >
          Start New Session
        </Button>
      </div>

      <Card muted sx={{ p: filterCardPadding }}>
        <Stack spacing={filterStackSpacing}>
          {isMobile && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsFilterExpanded(!isFilterExpanded)
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isFilterExpanded}
              aria-controls="filter-section"
              className={clsx(
                'cursor-pointer rounded-lg border px-4 py-2.5 transition-colors duration-150',
                isFilterExpanded ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-transparent'
              )}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Filter size={18} aria-hidden="true" />
                <Typography variant="subtitle2" component="span">
                  {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
                  {hasActiveFilters && !isFilterExpanded && (
                    <Chip
                      label="Active"
                      size="small"
                      color="primary"
                      aria-label="Filters are active"
                      className="ml-2"
                    />
                  )}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                aria-label={isFilterExpanded ? 'Collapse filters' : 'Expand filters'}
                tabIndex={-1}
              >
                {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </IconButton>
            </Stack>
          )}

          <Collapse in={!isMobile || isFilterExpanded} id="filter-section" unmountOnExit>
            <Stack spacing={2}>
              <ToggleButtonGroup
                exclusive
                value={filters.status}
                onChange={handleStatusChange}
                size="small"
                color="primary"
              >
                {SESSION_STATUS_OPTIONS.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                  <TextField
                    label="Search program or notes"
                    fullWidth
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onBlur={() => applySearch(searchValue)}
                  />
                </form>
                <TextField
                  label="Started from"
                  type="date"
                  value={filters.startedFrom}
                  onChange={(event) => handleDateChange('startedFrom', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Started to"
                  type="date"
                  value={filters.startedTo}
                  onChange={(event) => handleDateChange('startedTo', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} sx={{ height: 56 }}>
                    Clear filters
                  </Button>
                )}
              </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </Card>

      {listQuery.isError && (
        <Alert severity="error">Unable to load sessions. Please adjust your filters or try again.</Alert>
      )}

      {listQuery.isLoading ? (
        <Card>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <Stack spacing={1} alignItems="flex-start">
            <Typography variant="h6">No sessions found</Typography>
            <Typography color="text.secondary">
              {hasActiveFilters
                ? 'No workouts match the selected filters. Try relaxing them or clear filters to see everything.'
                : 'You have not logged any sessions yet. Start one from the dashboard to populate your diary.'}
            </Typography>
            <Button onClick={() => navigate('/app/dashboard')}>Go to Dashboard</Button>
          </Stack>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {sessions.map((session) => {
            const status = getStatusLabel(session)
            const progress = session.totalSetCount === 0
              ? 0
              : Math.min(100, Math.round((session.loggedSetCount / session.totalSetCount) * 100))

            return (
              <Card
                key={session.id}
                component="button"
                type="button"
                onClick={() => navigate(`/app/sessions/${session.id}`)}
                sx={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  p: 2.5,
                  transition: 'border-color 120ms ease, box-shadow 120ms ease',
                  '&:hover': { borderColor: 'primary.main' },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                }}
              >
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.3}>
                      <Typography variant="subtitle1" component="h3">
                        {session.programName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Started {formatDateTime(session.startedAt)} • Duration {formatDuration(session.duration)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                      <Chip label={status.label} color={status.color} size="small" />
                      <Typography variant="body2" color="text.secondary">
                        {session.exerciseCount} exercises
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Logged {session.loggedSetCount}/{session.totalSetCount} sets
                    </Typography>
                    <Box flex={1} width="100%">
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 4, borderRadius: 999 }}
                      />
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            )
          })}

          {pageCount > 1 && (
            <Stack direction="row" justifyContent="center" pt={1}>
              <Pagination count={pageCount} page={Math.min(filters.page, pageCount)} onChange={handlePageChange} color="primary" />
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  )
}

export default TrainingDiaryPage
