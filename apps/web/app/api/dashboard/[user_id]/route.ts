/**
 * Purpose: User Dashboard Composition API - Marcus Dashboard with real progress data
 * Owner: Dashboard System
 * Tags: [api, dashboard, composition, progress]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';

interface DashboardData {
  user: {
    id: string;
    name: string;
    next_video: any;
    videos_watched: number;
    total_videos: number;
    worksheets_completed: number;
    total_worksheets: number;
    overall_progress_percentage: number;
    recent_worksheets: any[];
    active_bold_actions: any[];
  };
  team: {
    leaderboard: any[];
  };
}

export async function GET(request: NextRequest, context: { params: { user_id: string } }) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await context.params;

    // Verify user can access this dashboard (self or manager)
    const { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, only allow users to see their own dashboard
    if (user.id !== user_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch user progress data
    const [
      userProgressResult,
      videoProgressResult,
      recentWorksheetsResult,
      boldActionsResult,
      teamLeaderboardResult
    ] = await Promise.all([
      // User progress summary
      supabase
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', user_id)
        .single(),

      // Video progress for next video
      supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user_id)
        .order('last_watched_at', { ascending: false })
        .limit(1),

      // Recent worksheet submissions
      supabase
        .from('form_responses')
        .select(`
          *,
          form:forms(title, description, video_id)
        `)
        .eq('user_id', user_id)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(5),

      // Active Bold Actions
      supabase
        .from('bold_actions')
        .select('*')
        .eq('user_id', user_id)
        .in('status', ['planned', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5),

      // Team leaderboard
      supabase
        .from('team_leaderboard')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('tenant_key', targetUser.tenant_key)
        .order('rank_position', { ascending: true })
        .limit(10)
    ]);

    // Handle the case where user has no progress summary yet
    const userProgress = userProgressResult.data || {
      videos_watched: 0,
      total_videos: 12, // Default total
      worksheets_completed: 0,
      total_worksheets: 12,
      video_progress_percentage: 0,
      worksheet_completion_percentage: 0,
      total_bold_actions: 0,
      bold_actions_completed: 0,
      bold_actions_in_progress: 0
    };

    // Build dashboard data structure
    const dashboardData: DashboardData = {
      user: {
        id: user_id,
        name: targetUser.full_name || 'User',
        next_video: {
          id: 'video-1',
          title: '5.1 Deep Work Part 1',
          description: 'The primary way to make a significant contribution to the organization and train your mind to do great work.',
          instructor: 'LeaderForge',
          duration: '8 minutes',
          level: 'beginner',
          progress_percentage: videoProgressResult.data?.[0]?.percentage_watched || 0,
          resume_time: videoProgressResult.data?.[0]?.current_time_seconds
            ? `${Math.floor(videoProgressResult.data[0].current_time_seconds / 60)}:${(videoProgressResult.data[0].current_time_seconds % 60).toString().padStart(2, '0')}`
            : '0:00',
          last_accessed: videoProgressResult.data?.[0]?.last_watched_at,
          worksheet_available: true
        },
        videos_watched: userProgress.videos_watched || 0,
        total_videos: userProgress.total_videos || 12,
        worksheets_completed: userProgress.worksheets_completed || 0,
        total_worksheets: userProgress.total_worksheets || 12,
        overall_progress_percentage: Math.round(
          ((userProgress.videos_watched || 0) + (userProgress.worksheets_completed || 0)) /
          ((userProgress.total_videos || 12) + (userProgress.total_worksheets || 12)) * 100
        ),
        recent_worksheets: recentWorksheetsResult.data?.map(response => ({
          id: response.id,
          title: response.form?.title || 'Worksheet',
          status: 'completed',
          submitted_at: response.submitted_at,
          form_id: response.form_id
        })) || [],
        active_bold_actions: boldActionsResult.data?.map(action => ({
          id: action.id,
          title: action.title,
          description: action.description,
          status: action.status,
          timeframe: action.timeframe,
          deadline: action.deadline,
          created_at: action.created_at
        })) || []
      },
      team: {
        leaderboard: teamLeaderboardResult.data?.map(entry => ({
          id: entry.user_id,
          name: entry.user?.full_name || 'Team Member',
          score: entry.score,
          rank: entry.rank_position,
          avatar_url: entry.user?.avatar_url,
          videos_completed: entry.videos_completed,
          worksheets_completed: entry.worksheets_completed,
          bold_actions_completed: entry.bold_actions_completed,
          is_current_user: entry.user_id === user_id
        })) || []
      }
    };

    // Marcus Dashboard Composition using existing widgets
    const marcusDashboard = {
      id: 'marcus-dashboard',
      name: 'Individual Dashboard',
      context_level: 'individual',
      user_id: user_id,
      data: dashboardData,
      composition: {
        type: 'Grid',
        config: {
          columns: { default: 1, md: 2, lg: 3 },
          gap: 6,
          maxWidth: '1200px',
          className: 'p-6'
        },
        data: {
          items: [
            {
              // Next Up Video - Enhanced LeaderForgeCard
              type: 'LeaderForgeCard',
              props: {
                variant: 'training',
                className: 'mb-6'
              },
              data: {
                training: {
                  title: dashboardData.user.next_video.title,
                  description: dashboardData.user.next_video.description,
                  instructor: dashboardData.user.next_video.instructor,
                  duration: dashboardData.user.next_video.duration,
                  level: dashboardData.user.next_video.level
                },
                progress: {
                  percentage: dashboardData.user.next_video.progress_percentage,
                  completed: dashboardData.user.next_video.progress_percentage >= 80,
                  lastAccessed: dashboardData.user.next_video.last_accessed
                },
                actions: [
                  {
                    type: dashboardData.user.next_video.progress_percentage > 0 ? 'continue' : 'start',
                    label: dashboardData.user.next_video.progress_percentage > 0
                      ? `Continue from ${dashboardData.user.next_video.resume_time}`
                      : 'Start Video',
                    enabled: true
                  },
                  {
                    type: 'review',
                    label: 'Worksheet',
                    enabled: dashboardData.user.next_video.worksheet_available
                  }
                ]
              },
              config: {
                trackingEnabled: true,
                gridSpan: { lg: 2 },
                priority: 1
              }
            },
            {
              // Progress Summary Card
              type: 'Card',
              props: {
                title: 'My Progress',
                variant: 'elevated'
              },
              data: {
                content: [
                  {
                    type: 'text',
                    content: `Videos: ${dashboardData.user.videos_watched}/${dashboardData.user.total_videos} watched`
                  },
                  {
                    type: 'text',
                    content: `Worksheets: ${dashboardData.user.worksheets_completed}/${dashboardData.user.total_worksheets} completed`
                  },
                  {
                    type: 'text',
                    content: `Bold Actions: ${dashboardData.user.active_bold_actions.length} active`
                  }
                ],
                progress: {
                  percentage: dashboardData.user.overall_progress_percentage,
                  label: `${dashboardData.user.overall_progress_percentage}% Complete`,
                  variant: dashboardData.user.overall_progress_percentage > 70 ? 'success' : 'default'
                }
              },
              config: {
                showProgress: true,
                priority: 2
              }
            },
            {
              // Team Leaderboard
              type: 'Leaderboard',
              props: {
                title: 'Team Rankings',
                showProgress: true,
                highlightCurrent: true
              },
              data: {
                entries: dashboardData.team.leaderboard.map(entry => ({
                  id: entry.id,
                  name: entry.name,
                  score: entry.score,
                  position: entry.rank,
                  avatar: entry.avatar_url,
                  progress: Math.round((entry.videos_completed + entry.worksheets_completed) / 24 * 100),
                  isCurrentUser: entry.is_current_user
                }))
              },
              config: {
                maxEntries: 5,
                showAvatars: true,
                priority: 3
              }
            },
            {
              // Recent Worksheets Activity
              type: 'Card',
              props: {
                title: 'Recent Worksheets',
                variant: 'default'
              },
              data: {
                content: dashboardData.user.recent_worksheets.length > 0
                  ? dashboardData.user.recent_worksheets.map(worksheet => ({
                      type: 'list',
                      content: `${worksheet.title} - Completed ${new Date(worksheet.submitted_at).toLocaleDateString()}`
                    }))
                  : [{ type: 'text', content: 'No worksheets completed yet. Start with your first video!' }]
              },
              config: {
                gridSpan: { lg: 2 },
                priority: 4
              }
            },
            {
              // Bold Actions Tracker
              type: 'Card',
              props: {
                title: 'My Bold Actions',
                variant: 'default'
              },
              data: {
                content: dashboardData.user.active_bold_actions.length > 0
                  ? dashboardData.user.active_bold_actions.map(action => ({
                      type: 'list',
                      content: `${action.title} - ${action.status} (${action.timeframe})`
                    }))
                  : [{ type: 'text', content: 'Complete your first worksheet to create Bold Actions!' }],
                actions: dashboardData.user.active_bold_actions.length > 0
                  ? [{ label: 'Manage Actions', variant: 'secondary' }]
                  : []
              },
              config: {
                priority: 5
              }
            }
          ]
        }
      }
    };

    return NextResponse.json(marcusDashboard);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}