import { NextRequest, NextResponse } from 'next/server'
import { StatsService } from '@/lib/stats-service'
import { TimeRange } from '@/lib/stats-types'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const timeRange = (searchParams.get('timeRange') || 'week') as TimeRange
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Validate time range
    const validTimeRanges: TimeRange[] = ['today', 'week', 'month', 'quarter', 'year', 'all']
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range. Valid options: today, week, month, quarter, year, all' },
        { status: 400 }
      )
    }

    // Get stats with options
    const stats = await StatsService.getDashboardStats({
      timeRange,
      includeDeleted,
      groupBy,
      limit
    })
    
    // Set cache headers based on time range
    const cacheSeconds = timeRange === 'today' ? 60 : 300 // 1 minute for today, 5 minutes for others
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': `public, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
        'X-Stats-Time-Range': timeRange,
        'X-Stats-Last-Updated': stats.lastUpdated
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    
    // Clear cache on error
    StatsService.clearCache()
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}