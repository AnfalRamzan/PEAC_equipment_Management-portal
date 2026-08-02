import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  loading: false,
  modalOpen: false,
  modalContent: null
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    openModal: (state, action) => {
      state.modalOpen = true
      state.modalContent = action.payload
    },
    closeModal: (state) => {
      state.modalOpen = false
      state.modalContent = null
    }
  }
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLoading,
  openModal,
  closeModal
} = uiSlice.actions

export default uiSlice.reducer