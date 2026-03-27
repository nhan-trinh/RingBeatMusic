import { prisma } from '../../shared/config/database';
import { AppError, ErrorCodes } from '../../shared/utils/app-error';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../shared/config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const PodcastService = {
  // ── Shows ──
  createShow: async (userId: string, data: any) => {
    const host = await prisma.podcastHost.findUnique({ where: { userId } });
    if (!host) throw new AppError('Bạn không phải là Podcast Host', 403, ErrorCodes.FORBIDDEN);
    return await prisma.podcastShow.create({
      data: { hostId: host.id, title: data.title, description: data.description, coverUrl: data.coverUrl },
    });
  },

  getShow: async (showId: string) => {
    const show = await prisma.podcastShow.findUnique({
      where: { id: showId },
      include: {
        host: { select: { displayName: true, avatarUrl: true } },
        episodes: { where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } },
        _count: { select: { subscribers: true } },
      },
    });
    if (!show) throw new AppError('Show không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return show;
  },

  updateShow: async (userId: string, showId: string, data: any) => {
    const host = await prisma.podcastHost.findUnique({ where: { userId } });
    const show = await prisma.podcastShow.findUnique({ where: { id: showId } });
    if (!show || show.hostId !== host?.id) throw new AppError('Không có quyền chỉnh sửa Show này', 403, ErrorCodes.FORBIDDEN);
    return await prisma.podcastShow.update({ where: { id: showId }, data });
  },

  listShows: async (page = 1, limit = 20) => {
    const [shows, total] = await Promise.all([
      prisma.podcastShow.findMany({
        skip: (page - 1) * limit, take: limit,
        include: { host: { select: { displayName: true } }, _count: { select: { subscribers: true, episodes: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.podcastShow.count(),
    ]);
    return { shows, total, page };
  },

  subscribe: async (userId: string, showId: string) => {
    try {
      await prisma.podcastSubscriber.create({ data: { showId, userId } });
    } catch {
      // Already subscribed
    }
    return { subscribed: true };
  },

  unsubscribe: async (userId: string, showId: string) => {
    try {
      await prisma.podcastSubscriber.delete({ where: { showId_userId: { showId, userId } } });
    } catch {}
    return { subscribed: false };
  },

  // ── Episodes ──
  createEpisode: async (userId: string, showId: string, data: any) => {
    const host = await prisma.podcastHost.findUnique({ where: { userId } });
    const show = await prisma.podcastShow.findUnique({ where: { id: showId } });
    if (!show || show.hostId !== host?.id) throw new AppError('Không có quyền', 403, ErrorCodes.FORBIDDEN);

    return await prisma.podcastEpisode.create({
      data: {
        showId,
        title: data.title,
        description: data.description,
        audioUrl: data.audioUrl,
        duration: data.duration || 0,
        status: data.publishNow ? 'PUBLISHED' : 'DRAFT',
        publishedAt: data.publishNow ? new Date() : (data.publishAt ? new Date(data.publishAt) : null),
      },
    });
  },

  getEpisode: async (episodeId: string) => {
    const episode = await prisma.podcastEpisode.findUnique({
      where: { id: episodeId },
      include: { show: { select: { title: true, host: { select: { displayName: true } } } } },
    });
    if (!episode) throw new AppError('Episode không tồn tại', 404, ErrorCodes.NOT_FOUND);
    return episode;
  },

  updateEpisode: async (userId: string, episodeId: string, data: any) => {
    const host = await prisma.podcastHost.findUnique({ where: { userId } });
    const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId }, include: { show: true } });
    if (!episode || episode.show.hostId !== host?.id) throw new AppError('Không có quyền', 403, ErrorCodes.FORBIDDEN);
    return await prisma.podcastEpisode.update({ where: { id: episodeId }, data });
  },

  deleteEpisode: async (userId: string, episodeId: string) => {
    const host = await prisma.podcastHost.findUnique({ where: { userId } });
    const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId }, include: { show: true } });
    if (!episode || episode.show.hostId !== host?.id) throw new AppError('Không có quyền', 403, ErrorCodes.FORBIDDEN);
    await prisma.podcastEpisode.delete({ where: { id: episodeId } });
    return { message: 'Đã xóa episode' };
  },

  getStreamUrl: async (episodeId: string) => {
    const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new AppError('Episode không tồn tại', 404, ErrorCodes.NOT_FOUND);
    // Tạo Supabase signed URL (TTL 1 giờ)
    const { data, error } = await supabase.storage
      .from('podcasts')
      .createSignedUrl(episode.audioUrl, 3600);
    if (error || !data) throw new AppError('Không thể tạo stream URL', 500, ErrorCodes.INTERNAL_ERROR);
    return { streamUrl: data.signedUrl, expiresIn: 3600 };
  },

  // ── Host Analytics ──
  getHostAnalytics: async (userId: string) => {
    const host = await prisma.podcastHost.findUnique({ where: { userId } });
    if (!host) throw new AppError('Không phải Podcast Host', 403, ErrorCodes.FORBIDDEN);
    const [showCount, totalEpisodes, totalPlays, subscribers] = await Promise.all([
      prisma.podcastShow.count({ where: { hostId: host.id } }),
      prisma.podcastEpisode.count({ where: { show: { hostId: host.id } } }),
      prisma.podcastEpisode.aggregate({ where: { show: { hostId: host.id } }, _sum: { playCount: true } }),
      prisma.podcastSubscriber.count({ where: { show: { hostId: host.id } } }),
    ]);
    return { showCount, totalEpisodes, totalPlays: totalPlays._sum.playCount || 0, subscribers };
  },
};
