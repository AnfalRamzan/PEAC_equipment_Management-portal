import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// ✅ Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications');
      return response.data.notifications;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// ✅ Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

// ✅ Mark single notification as read
export const markAsRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue, dispatch }) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      dispatch(fetchUnreadCount()); // ✅ Update count after marking read
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

// ✅ Mark all notifications as read
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.put('/notifications/read-all');
      dispatch(fetchUnreadCount()); // ✅ Update count after marking all read
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

// ✅ Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      dispatch(fetchUnreadCount()); // ✅ Update count after deleting
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1; // ✅ Immediately increase count
      }
    },
    // ✅ NEW: Increment unread count (for real-time updates)
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    // ✅ NEW: Set unread count directly
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        // ✅ Count unread from fetched notifications
        state.unreadCount = action.payload.filter(n => n.is_read === 0).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload; // ✅ Update count
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.is_read) {
          notification.is_read = 1;
          state.unreadCount = Math.max(0, state.unreadCount - 1); // ✅ Decrease count
        }
      })
      
      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.is_read = 1);
        state.unreadCount = 0; // ✅ Set to 0
      })
      
      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1); // ✅ Decrease count
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      });
  },
});

// ✅ Export new actions
export const { clearNotifications, addNotification, incrementUnreadCount, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;