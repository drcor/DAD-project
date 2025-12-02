<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
    <div class="w-full max-w-md space-y-8">
      <h2 class="text-center text-3xl font-bold text-gray-900">Create Account</h2>

      <form class="space-y-4" @submit.prevent="handleRegister">

        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <Input v-model="form.name" required placeholder="John Doe" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Nickname</label>
          <Input v-model="form.nickname" required placeholder="johnny" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <Input v-model="form.email" type="email" required placeholder="you@example.com" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <Input v-model="form.password" type="password" required minlength="3" />
        </div>

        <Button type="submit" class="w-full">Create Account</Button>

        <p class="text-center text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="text-blue-600">Sign in</router-link>
        </p>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import api from "@/services/api"

const router = useRouter()

const form = ref({
  name: "",
  nickname: "",
  email: "",
  password: ""
})

const handleRegister = async () => {
  try {
    const response = await api.post("/register", form.value)

    toast.success("Account created! You can now log in.")
    router.push("/login")
  } catch (err) {
    toast.error(err.response?.data?.message || "Registration failed.")
  }
}
</script>