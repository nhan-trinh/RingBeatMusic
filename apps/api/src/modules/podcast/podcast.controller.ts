import { Request, Response } from 'express';
import { PodcastService } from './podcast.service';
import { sendSuccess } from '../../shared/utils/response';
import { catchAsync } from '../../shared/utils/catch-async';

export const podcastController = {
  // Shows
  createShow: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.createShow(req.user!.id, req.body);
    sendSuccess(res, result, 'Đã tạo Show', 201);
  }),
  getShow: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await PodcastService.getShow(req.params.id));
  }),
  updateShow: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.updateShow(req.user!.id, req.params.id, req.body);
    sendSuccess(res, result);
  }),
  listShows: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.listShows(Number(req.query.page) || 1);
    sendSuccess(res, result);
  }),
  subscribe: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.subscribe(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),
  unsubscribe: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.unsubscribe(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),

  // Episodes
  createEpisode: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.createEpisode(req.user!.id, req.params.showId, req.body);
    sendSuccess(res, result, 'Đã tạo episode', 201);
  }),
  getEpisode: catchAsync(async (req: Request, res: Response) => {
    sendSuccess(res, await PodcastService.getEpisode(req.params.id));
  }),
  updateEpisode: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.updateEpisode(req.user!.id, req.params.id, req.body);
    sendSuccess(res, result);
  }),
  deleteEpisode: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.deleteEpisode(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }),
  streamEpisode: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.getStreamUrl(req.params.id);
    sendSuccess(res, result);
  }),

  // Analytics
  getAnalytics: catchAsync(async (req: Request, res: Response) => {
    const result = await PodcastService.getHostAnalytics(req.user!.id);
    sendSuccess(res, result);
  }),
};
