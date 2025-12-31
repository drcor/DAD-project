<script setup>
import { onMounted, ref } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Users,
  UserPlus,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-vue-next'

const adminStore = useAdminStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const typeFilter = ref('')
const blockedFilter = ref('')
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref(null)

const newAdmin = ref({
  name: '',
  email: '',
  nickname: '',
  password: '',
})

onMounted(() => {
  adminStore.fetchAllUsers()
})

const isCurrentUser = (userId) => {
  return userId === authStore.currentUser?.id
}

const applyFilters = () => {
  const filters = {}
  if (typeFilter.value) filters.type = typeFilter.value
  if (blockedFilter.value) filters.blocked = blockedFilter.value
  if (searchQuery.value) filters.search = searchQuery.value

  adminStore.fetchAllUsers(1, adminStore.pagination.perPage, filters)
}

const clearFilters = () => {
  searchQuery.value = ''
  typeFilter.value = ''
  blockedFilter.value = ''
  adminStore.fetchAllUsers()
}

const handleBlockUser = async (user) => {
  if (confirm(`Are you sure you want to block ${user.nickname}?`)) {
    try {
      await adminStore.blockUser(user.id)
      await adminStore.fetchAllUsers(
        adminStore.pagination.currentPage,
        adminStore.pagination.perPage,
      )
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to block user')
    }
  }
}

const handleUnblockUser = async (user) => {
  if (confirm(`Are you sure you want to unblock ${user.nickname}?`)) {
    try {
      await adminStore.unblockUser(user.id)
      await adminStore.fetchAllUsers(
        adminStore.pagination.currentPage,
        adminStore.pagination.perPage,
      )
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to unblock user')
    }
  }
}

const openDeleteModal = (user) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

const handleDeleteUser = async () => {
  try {
    const result = await adminStore.deleteUser(selectedUser.value.id)
    alert(result.message)
    showDeleteModal.value = false
    selectedUser.value = null
    await adminStore.fetchAllUsers(adminStore.pagination.currentPage, adminStore.pagination.perPage)
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to delete user')
  }
}

const handleCreateAdmin = async () => {
  try {
    const result = await adminStore.createAdmin(newAdmin.value)
    alert(result.message)
    showCreateModal.value = false
    newAdmin.value = { name: '', email: '', nickname: '', password: '' }
    await adminStore.fetchAllUsers(adminStore.pagination.currentPage, adminStore.pagination.perPage)
  } catch (error) {
    const errors = error.response?.data?.errors
    if (errors) {
      const errorMessages = Object.values(errors).flat().join('\n')
      alert(errorMessages)
    } else {
      alert(error.response?.data?.message || 'Failed to create administrator')
    }
  }
}

// Pagination
const goToPage = (page) => {
  if (page >= 1 && page <= adminStore.pagination.lastPage) {
    const filters = {}
    if (typeFilter.value) filters.type = typeFilter.value
    if (blockedFilter.value) filters.blocked = blockedFilter.value
    if (searchQuery.value) filters.search = searchQuery.value

    adminStore.fetchAllUsers(page, adminStore.pagination.perPage, filters)
  }
}

const nextPage = () => {
  if (adminStore.pagination.currentPage < adminStore.pagination.lastPage) {
    goToPage(adminStore.pagination.currentPage + 1)
  }
}

const previousPage = () => {
  if (adminStore.pagination.currentPage > 1) {
    goToPage(adminStore.pagination.currentPage - 1)
  }
}

const getPageNumbers = () => {
  const current = adminStore.pagination.currentPage
  const last = adminStore.pagination.lastPage
  const pages = []

  if (last <= 7) {
    for (let i = 1; i <= last; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(last - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < last - 2) pages.push('...')
    pages.push(last)
  }

  return pages
}
</script>

<template>
  <div class="flex justify-center items-start min-h-[80vh] py-10 bg-slate-50">
    <div
      class="w-full max-w-7xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mx-4"
    >
      <!-- Header -->
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between mb-6">
          <div class="space-y-1.5">
            <h3 class="font-semibold tracking-tight text-2xl flex items-center gap-2">
              <Users class="w-6 h-6 text-purple-600" />
              User Management
            </h3>
            <p class="text-sm text-slate-500">Manage all platform users and administrators.</p>
          </div>

          <button
            @click="showCreateModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <UserPlus class="w-4 h-4" />
            Create Administrator
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              @input="applyFilters"
              type="text"
              placeholder="Search users..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>

          <select
            v-model="typeFilter"
            @change="applyFilters"
            class="px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          >
            <option value="">All Types</option>
            <option value="P">Players</option>
            <option value="A">Administrators</option>
          </select>

          <select
            v-model="blockedFilter"
            @change="applyFilters"
            class="px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>

          <button
            @click="clearFilters"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="adminStore.loading"
        class="py-12 flex flex-col items-center justify-center text-slate-500"
      >
        <Loader2 class="w-8 h-8 animate-spin mb-2 text-purple-600" />
        <p>Loading users...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="adminStore.error"
        class="py-12 flex flex-col items-center justify-center text-red-500"
      >
        <AlertCircle class="w-8 h-8 mb-2" />
        <p>{{ adminStore.error }}</p>
      </div>

      <!-- Users Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-4 text-left">User</th>
              <th class="px-6 py-4 text-left">Email</th>
              <th class="px-6 py-4 text-left">Type</th>
              <th class="px-6 py-4 text-left">Status</th>
              <th class="px-6 py-4 text-left">Coins</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="user in adminStore.users"
              :key="user.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <!-- User Info -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div v-if="user.photo_url" class="w-10 h-10 rounded-full overflow-hidden">
                    <img :src="user.photo_url" alt="Avatar" class="w-full h-full object-cover" />
                  </div>
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center text-sm font-bold"
                  >
                    {{ user.nickname[0].toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">{{ user.nickname }}</div>
                    <div class="text-xs text-slate-500">{{ user.name }}</div>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="px-6 py-4 text-slate-600">{{ user.email }}</td>

              <!-- Type -->
              <td class="px-6 py-4">
                <Badge
                  v-if="user.type === 'A'"
                  class="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Shield class="w-3 h-3 mr-1" />
                  Admin
                </Badge>
                <Badge v-else class="bg-blue-50 text-blue-700 border-blue-200"> Player </Badge>
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <Badge
                  v-if="user.blocked"
                  variant="destructive"
                  class="bg-red-50 text-red-700 border-red-200"
                >
                  <Ban class="w-3 h-3 mr-1" />
                  Blocked
                </Badge>
                <Badge v-else class="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle class="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </td>

              <!-- Coins -->
              <td class="px-6 py-4 text-slate-600">{{ user.coins_balance }} 🪙</td>

              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <!-- Block/Unblock (only for players) -->
                  <template v-if="user.type === 'P'">
                    <button
                      v-if="!user.blocked"
                      @click="handleBlockUser(user)"
                      class="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      title="Block user"
                    >
                      <Ban class="w-4 h-4" />
                    </button>
                    <button
                      v-else
                      @click="handleUnblockUser(user)"
                      class="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      title="Unblock user"
                    >
                      <CheckCircle class="w-4 h-4" />
                    </button>
                  </template>

                  <!-- Delete (not for current user) -->
                  <button
                    v-if="!isCurrentUser(user.id)"
                    @click="openDeleteModal(user)"
                    class="px-3 py-1.5 text-sm bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="adminStore.users.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                <Users class="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p>No users found.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="!adminStore.loading && !adminStore.error && adminStore.users.length > 0"
        class="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/50"
      >
        <div class="text-sm text-slate-600">
          Showing
          <span class="font-medium">{{
            (adminStore.pagination.currentPage - 1) * adminStore.pagination.perPage + 1
          }}</span>
          to
          <span class="font-medium">{{
            Math.min(
              adminStore.pagination.currentPage * adminStore.pagination.perPage,
              adminStore.pagination.total,
            )
          }}</span>
          of
          <span class="font-medium">{{ adminStore.pagination.total }}</span>
          users
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="previousPage"
            :disabled="adminStore.pagination.currentPage === 1"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft class="w-4 h-4" />
            <span class="text-sm font-medium">Previous</span>
          </button>

          <div class="flex items-center gap-1">
            <template v-for="page in getPageNumbers()" :key="page">
              <button
                v-if="page !== '...'"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  page === adminStore.pagination.currentPage
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-50',
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-2 text-slate-400">...</span>
            </template>
          </div>

          <button
            @click="nextPage"
            :disabled="adminStore.pagination.currentPage === adminStore.pagination.lastPage"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <span class="text-sm font-medium">Next</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create Admin Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus class="w-5 h-5 text-purple-600" />
          Create Administrator Account
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              v-model="newAdmin.name"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="Full name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              v-model="newAdmin.email"
              type="email"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
            <input
              v-model="newAdmin.nickname"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="Username"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              v-model="newAdmin.password"
              type="password"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="Secure password"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="handleCreateAdmin"
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Administrator
          </button>
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal && selectedUser"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showDeleteModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-semibold mb-4 flex items-center gap-2 text-red-600">
          <Trash2 class="w-5 h-5" />
          Delete User Account
        </h3>

        <p class="text-slate-600 mb-4">
          Are you sure you want to delete the account for
          <strong>{{ selectedUser.nickname }}</strong> ({{ selectedUser.name }})?
        </p>

        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-amber-800">
            <strong>Note:</strong> If this user has prior activity (games, matches, or
            transactions), the account will be soft-deleted. Otherwise, it will be permanently
            removed.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            @click="handleDeleteUser"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete User
          </button>
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
