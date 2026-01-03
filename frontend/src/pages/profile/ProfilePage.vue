<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white shadow rounded-lg">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900">My Profile</h2>
        </div>

        <!-- Profile content -->
        <div class="p-6 space-y-8">
          <!-- Loading state -->
          <div v-if="loading" class="text-center py-8">
            <p class="text-gray-500">Loading...</p>
          </div>

          <template v-else>
            <!-- Success/Error messages -->
            <div
              v-if="successMessage"
              class="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded"
            >
              {{ successMessage }}
            </div>
            <div
              v-if="errorMessage"
              class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
            >
              {{ errorMessage }}
            </div>

            <!-- Profile Photo Section -->
            <div class="flex items-center space-x-6">
              <div class="flex-shrink-0">
                <img
                  v-if="profile?.photo_url"
                  :src="profile.photo_url"
                  alt="Profile photo"
                  class="w-24 h-24 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  <span class="text-3xl text-gray-500">{{
                    profile?.nickname?.[0]?.toUpperCase()
                  }}</span>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">Profile Photo</h3>
                <div class="mt-2 flex space-x-2">
                  <label
                    class="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      @change="handlePhotoUpload"
                      class="hidden"
                    />
                  </label>
                  <button
                    v-if="profile?.photo_url"
                    @click="handlePhotoDelete"
                    class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            </div>

            <!-- Coin Balance -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">Coin Balance</h3>
                  <p class="text-sm text-gray-600">Your available coins for playing games</p>
                </div>
                <div class="text-3xl font-bold text-yellow-600">
                  {{ profile?.coins_balance || 0 }} 🪙
                </div>
              </div>
            </div>

            <!-- Personal Statistics -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">My Statistics</h3>

              <!-- Loading state for stats -->
              <div v-if="statsLoading" class="text-center py-8">
                <p class="text-gray-500">Loading statistics...</p>
              </div>

              <!-- Stats Content -->
              <div v-else-if="statistics" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Games Stats -->
                <div class="bg-white rounded-lg p-4 border border-gray-200">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-700">Games</h4>
                    <span class="text-2xl">🎮</span>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total Played:</span>
                      <span class="font-semibold">{{ statistics.games.total_played }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Won:</span>
                      <span class="font-semibold text-green-600">{{ statistics.games.total_won }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Lost:</span>
                      <span class="font-semibold text-red-600">{{ statistics.games.total_lost }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Draws:</span>
                      <span class="font-semibold text-gray-600">{{ statistics.games.total_draws }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Win Rate:</span>
                      <span class="font-semibold text-blue-600"
                        >{{ statistics.games.win_rate }}%</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Matches Stats -->
                <div class="bg-white rounded-lg p-4 border border-gray-200">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-700">Matches</h4>
                    <span class="text-2xl">🏆</span>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total Played:</span>
                      <span class="font-semibold">{{ statistics.matches.total_played }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Won:</span>
                      <span class="font-semibold text-green-600">{{ statistics.matches.total_won }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Lost:</span>
                      <span class="font-semibold text-red-600">{{ statistics.matches.total_lost }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Win Rate:</span>
                      <span class="font-semibold text-blue-600"
                        >{{ statistics.matches.win_rate }}%</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Achievements Stats -->
                <div class="bg-white rounded-lg p-4 border border-gray-200">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-700">Achievements</h4>
                    <span class="text-2xl">⭐</span>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Capotes:</span>
                      <span class="font-semibold text-orange-600">{{
                        statistics.achievements.total_capotes
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Bandeiras:</span>
                      <span class="font-semibold text-pink-600">{{
                        statistics.achievements.total_bandeiras
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Forfeits Received:</span>
                      <span class="font-semibold text-gray-600">{{
                        statistics.achievements.forfeits_received
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Forfeits Given:</span>
                      <span class="font-semibold text-gray-600">{{
                        statistics.achievements.forfeits_given
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- By Variant Stats -->
                <div class="bg-white rounded-lg p-4 border border-gray-200">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-700">By Variant</h4>
                    <span class="text-2xl">🃏</span>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div>
                      <div class="font-medium text-gray-700 mb-1">Bisca 3</div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600"
                          >{{ statistics.by_variant.bisca_3.games_won }}/{{
                            statistics.by_variant.bisca_3.games_played
                          }}
                          won</span
                        >
                        <span class="text-gray-600"
                          >{{ statistics.by_variant.bisca_3.capotes }}C /
                          {{ statistics.by_variant.bisca_3.bandeiras }}B</span
                        >
                      </div>
                    </div>
                    <div>
                      <div class="font-medium text-gray-700 mb-1">Bisca 9</div>
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-600"
                          >{{ statistics.by_variant.bisca_9.games_won }}/{{
                            statistics.by_variant.bisca_9.games_played
                          }}
                          won</span
                        >
                        <span class="text-gray-600"
                          >{{ statistics.by_variant.bisca_9.capotes }}C /
                          {{ statistics.by_variant.bisca_9.bandeiras }}B</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Load stats button if not loaded -->
              <div v-else class="text-center">
                <button
                  @click="loadStatistics"
                  class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Load My Statistics
                </button>
              </div>
            </div>

            <!-- Profile Information Form -->
            <form @submit.prevent="handleUpdateProfile" class="space-y-6">
              <h3 class="text-lg font-medium text-gray-900">Profile Information</h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="email"
                    v-model="formData.email"
                    type="email"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="nickname" class="block text-sm font-medium text-gray-700"
                    >Nickname</label
                  >
                  <input
                    id="nickname"
                    v-model="formData.nickname"
                    type="text"
                    minlength="3"
                    maxlength="20"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label for="name" class="block text-sm font-medium text-gray-700"
                    >Full Name</label
                  >
                  <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="updating"
                  class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ updating ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>

            <!-- Change Password Form -->
            <form
              @submit.prevent="handleUpdatePassword"
              class="space-y-6 pt-6 border-t border-gray-200"
            >
              <h3 class="text-lg font-medium text-gray-900">Change Password</h3>

              <div class="grid grid-cols-1 gap-6">
                <div>
                  <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    v-model="passwordData.current_password"
                    type="password"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="newPassword" class="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    v-model="passwordData.new_password"
                    type="password"
                    minlength="3"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="confirmNewPassword" class="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    v-model="confirmNewPassword"
                    type="password"
                    minlength="3"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="updatingPassword"
                  class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ updatingPassword ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>

            <!-- Delete Account Section -->
            <div v-if="profile?.type !== 'A'" class="pt-6 border-t border-gray-200">
              <h3 class="text-lg font-medium text-red-600">Danger Zone</h3>
              <p class="mt-2 text-sm text-gray-600">
                Once you delete your account, there is no going back. All coins will be forfeited.
              </p>
              <button
                @click="showDeleteConfirmation = true"
                class="mt-4 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>

            <!-- Message for Administrators -->
            <div v-else class="pt-6 border-t border-gray-200">
              <h3 class="text-lg font-medium text-gray-600">Account Deletion</h3>
              <p class="mt-2 text-sm text-gray-600">
                Administrators cannot delete their own accounts for security reasons.
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Account Deletion</h3>
        <p class="text-sm text-gray-600 mb-4">
          To confirm, please enter your nickname or password. All coins will be forfeited.
        </p>
        <input
          v-model="deleteConfirmation"
          type="text"
          placeholder="Enter your nickname or password"
          class="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="showDeleteConfirmation = false"
            class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="handleDeleteAccount"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {{ deleting ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

const profile = ref(null)
const loading = ref(true)
const updating = ref(false)
const updatingPassword = ref(false)
const deleting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Statistics
const statistics = ref(null)
const statsLoading = ref(false)

const formData = ref({
  email: '',
  nickname: '',
  name: '',
})

const passwordData = ref({
  current_password: '',
  new_password: '',
})

const confirmNewPassword = ref('')
const showDeleteConfirmation = ref(false)
const deleteConfirmation = ref('')

const loadProfile = async () => {
  try {
    loading.value = true
    const response = await apiStore.getProfile()
    profile.value = response.data

    // Populate form
    formData.value = {
      email: profile.value.email,
      nickname: profile.value.nickname,
      name: profile.value.name,
    }

    // Auto-load statistics
    await loadStatistics()
  } catch (error) {
    console.error('Failed to load profile:', error)
    errorMessage.value = 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    statsLoading.value = true
    const response = await axios.get('/api/users/me/statistics')
    statistics.value = response.data
  } catch (error) {
    console.error('Failed to load statistics:', error)
  } finally {
    statsLoading.value = false
  }
}

const handleUpdateProfile = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  updating.value = true

  try {
    const response = await apiStore.updateProfile(formData.value)
    profile.value = response.data.user

    // Update current user in auth store
    authStore.currentUser = response.data.user
    sessionStorage.setItem('currentUser', JSON.stringify(response.data.user))

    successMessage.value = response.data.message
  } catch (error) {
    console.error('Failed to update profile:', error)
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors
      errorMessage.value = Object.values(errors).flat().join(', ')
    } else {
      errorMessage.value = 'Failed to update profile'
    }
  } finally {
    updating.value = false
  }
}

const handleUpdatePassword = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (passwordData.value.new_password !== confirmNewPassword.value) {
    errorMessage.value = 'New passwords do not match'
    return
  }

  updatingPassword.value = true

  try {
    const response = await apiStore.updatePassword(passwordData.value)
    successMessage.value = response.data.message

    // Clear password fields
    passwordData.value = {
      current_password: '',
      new_password: '',
    }
    confirmNewPassword.value = ''
  } catch (error) {
    console.error('Failed to update password:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to update password'
  } finally {
    updatingPassword.value = false
  }
}

const handlePhotoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = 'Photo must be less than 2MB'
    return
  }

  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await apiStore.uploadPhoto(file)
    profile.value = response.data.user

    // Update current user in auth store
    authStore.currentUser = response.data.user
    sessionStorage.setItem('currentUser', JSON.stringify(response.data.user))

    successMessage.value = response.data.message
  } catch (error) {
    console.error('Failed to upload photo:', error)
    errorMessage.value = 'Failed to upload photo'
  }
}

const handlePhotoDelete = async () => {
  if (!confirm('Are you sure you want to remove your photo?')) return

  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await apiStore.deletePhoto()
    profile.value = response.data.user

    // Update current user in auth store
    authStore.currentUser = response.data.user
    sessionStorage.setItem('currentUser', JSON.stringify(response.data.user))

    successMessage.value = response.data.message
  } catch (error) {
    console.error('Failed to delete photo:', error)
    errorMessage.value = 'Failed to delete photo'
  }
}

const handleDeleteAccount = async () => {
  if (!deleteConfirmation.value) {
    errorMessage.value = 'Please enter your nickname or password to confirm'
    return
  }

  successMessage.value = ''
  errorMessage.value = ''
  deleting.value = true

  try {
    await apiStore.deleteAccount(deleteConfirmation.value)

    // Logout and redirect
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Failed to delete account:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to delete account'
    deleting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>
