import { db } from './db'

interface NotificationData {
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
}

export async function sendNotification(data: NotificationData) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    })

    // TODO: Enviar notificação via Socket.io
    // io.to(data.userId).emit('notification', notification)

    // TODO: Enviar push notification (se habilitado)

    return notification
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

export async function getUnreadNotifications(userId: string) {
  return db.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.update({
    where: {
      id: notificationId,
      userId, // Security: só pode marcar suas próprias notificações
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

export async function deleteNotification(notificationId: string, userId: string) {
  return db.notification.delete({
    where: {
      id: notificationId,
      userId,
    },
  })
}
