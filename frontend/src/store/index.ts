import { configureStore } from '@reduxjs/toolkit'
import { customersSlice } from '../features/customers/store/customersSlice.js'
import { recordingsSlice } from '../features/recordings/store/recordingsSlice.js'
import { recorderSlice } from '../features/recordings/store/recorderSlice.js'
import { networkSlice } from '../features/offline/store/networkSlice.js'

export const store = configureStore({
  reducer: {
    customers: customersSlice.reducer,
    recordings: recordingsSlice.reducer,
    recorder: recorderSlice.reducer,
    network: networkSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['recorder/startRecording', 'recorder/stopRecording', 'recorder/setMediaStream', 'recorder/setWakeLock', 'recorder/addSegment'],
        ignoredPaths: ['recorder'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
