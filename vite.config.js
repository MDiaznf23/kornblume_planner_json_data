import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' -> pakai path relatif supaya build ini bisa langsung dideploy ke GitHub
// Pages project page (https://<user>.github.io/<repo>/) TANPA perlu hardcode nama repo.
export default defineConfig({
  base: './',
  plugins: [vue()],
})
