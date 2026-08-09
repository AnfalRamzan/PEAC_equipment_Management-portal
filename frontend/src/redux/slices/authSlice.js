// src/redux/slices/authSlice.js - FIXED WITH PROPER PROFILE PICTURE UPDATE

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../api/services'
import { toast } from 'react-toastify'

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return { token, user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return null
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser()
      return response.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

// ✅ NEW: Upload profile picture thunk
export const uploadProfilePicture = createAsyncThunk(
  'auth/uploadProfilePicture',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await authService.uploadProfilePicture(formData)
      return response.data.profileImage
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload')
    }
  }
)

// ✅ NEW: Delete profile picture thunk
export const deleteProfilePicture = createAsyncThunk(
  'auth/deleteProfilePicture',
  async (_, { rejectWithValue }) => {
    try {
      await authService.deleteProfilePicture()
      return null
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete')
    }
  }
)

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload))
      }
    },
    // ✅ FIXED: updateUser now properly updates all fields including profile_image
    updateUser: (state, action) => {
      console.log('🔄 updateUser called with:', action.payload)
      
      // ✅ Merge existing user with new data
      state.user = { 
        ...state.user, 
        ...action.payload,
        // ✅ Ensure role is preserved
        role: action.payload.role || state.user?.role,
        role_name: action.payload.role_name || action.payload.role || state.user?.role_name
      }
      
      // ✅ Update localStorage to keep in sync
      if (state.user) {
        localStorage.setItem('user', JSON.stringify(state.user))
        console.log('✅ User updated in localStorage:', state.user)
      }
    },
    refreshUser: (state) => {
      const user = JSON.parse(localStorage.getItem('user'))
      if (user) {
        state.user = user
        console.log('🔄 User refreshed from localStorage:', user)
      }
    },
    // ✅ NEW: Force update profile image only
    updateProfileImage: (state, action) => {
      const imageUrl = action.payload
      console.log('🖼️ updateProfileImage called with:', imageUrl)
      
      if (state.user) {
        state.user = {
          ...state.user,
          profile_image: imageUrl
        }
        localStorage.setItem('user', JSON.stringify(state.user))
        console.log('✅ Profile image updated in Redux and localStorage:', imageUrl)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        toast.success('Login successful!')
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Login failed')
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        toast.info('Logged out successfully')
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        if (action.payload) {
          localStorage.setItem('user', JSON.stringify(action.payload))
        }
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      // ✅ Upload profile picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.loading = true
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.loading = false
        if (state.user) {
          state.user = {
            ...state.user,
            profile_image: action.payload
          }
          localStorage.setItem('user', JSON.stringify(state.user))
          toast.success('✅ Profile picture uploaded successfully!')
        }
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to upload profile picture')
      })
      // ✅ Delete profile picture
      .addCase(deleteProfilePicture.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteProfilePicture.fulfilled, (state) => {
        state.loading = false
        if (state.user) {
          state.user = {
            ...state.user,
            profile_image: null
          }
          localStorage.setItem('user', JSON.stringify(state.user))
          toast.success('✅ Profile picture removed successfully!')
        }
      })
      .addCase(deleteProfilePicture.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to delete profile picture')
      })
  }
})

// ✅ Export actions
export const { 
  clearError, 
  setUser, 
  updateUser, 
  refreshUser,
  updateProfileImage  // ✅ NEW
} = authSlice.actions

export default authSlice.reducer