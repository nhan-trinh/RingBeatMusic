import mongoose, { Schema, Document } from 'mongoose';

export interface IListeningHistory extends Document {
  userId: string;
  songId: string;
  playedAt: Date;
  durationPlayed: number;
  completed: boolean;
  deviceType: string;
}

const listeningHistorySchema = new Schema<IListeningHistory>({
  userId: { type: String, required: true, index: true },
  songId: { type: String, required: true },
  playedAt: { type: Date, default: Date.now },
  durationPlayed: { type: Number, required: true, default: 0 },
  completed: { type: Boolean, default: false },
  deviceType: { type: String, default: 'web' },
});
listeningHistorySchema.index({ userId: 1, playedAt: -1 });

export const ListeningHistory = mongoose.model<IListeningHistory>('ListeningHistory', listeningHistorySchema);

export interface IRecentlyPlayed extends Document {
  userId: string;
  items: Array<{
    songId: string;
    playedAt: Date;
  }>;
  updatedAt: Date;
}

const recentlyPlayedSchema = new Schema<IRecentlyPlayed>({
  userId: { type: String, required: true, unique: true },
  items: [
    {
      songId: { type: String, required: true },
      playedAt: { type: Date, default: Date.now },
    }
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const RecentlyPlayed = mongoose.model<IRecentlyPlayed>('RecentlyPlayed', recentlyPlayedSchema);

export interface IInteractionHistory extends Document {
  userId: string;
  items: Array<{
    type: 'ARTIST' | 'ALBUM' | 'PLAYLIST' | 'SONG';
    targetId: string;
    visitedAt: Date;
  }>;
  updatedAt: Date;
}

const interactionHistorySchema = new Schema<IInteractionHistory>({
  userId: { type: String, required: true, unique: true },
  items: [
    {
      type: { type: String, enum: ['ARTIST', 'ALBUM', 'PLAYLIST', 'SONG'], required: true },
      targetId: { type: String, required: true },
      visitedAt: { type: Date, default: Date.now },
    }
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const InteractionHistory = mongoose.model<IInteractionHistory>('InteractionHistory', interactionHistorySchema);
