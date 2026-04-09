import api from "@/lib/axios";

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  data: Notification[];
  total: number;
  skip: number;
  take: number;
  pages: number;
};

export const notificationService = {
  async getNotifications(params?: {
    skip?: number;
    take?: number;
    type?: string;
  }): Promise<NotificationListResponse> {
    const res = await api.get("/notifications", { params });
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get("/notifications/unread-count");
    return res.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/mark-all-read");
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
